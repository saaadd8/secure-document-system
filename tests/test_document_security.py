"""End-to-end API tests for document authentication and authorization."""

from datetime import datetime, timedelta, timezone

import pytest

from app.models import AuditLog


PDF_BYTES = b"%PDF-1.4\n% secure document test fixture\n%%EOF\n"
PASSWORD = "correct-horse-battery-staple"


def register_user(client, email, name="Test User"):
    response = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": PASSWORD},
    )
    assert response.status_code == 201, response.text
    return response.json()


def login_headers(client, email):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_user(client, email, name="Test User"):
    user = register_user(client, email, name)
    return user, login_headers(client, email)


def upload_pdf(client, headers, filename="document.pdf"):
    response = client.post(
        "/documents/upload",
        headers=headers,
        files={"file": (filename, PDF_BYTES, "application/pdf")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def grant_share(client, owner_headers, document_id, recipient_email, permission, expires_at=None):
    payload = {"recipient_email": recipient_email, "permission": permission}
    if expires_at is not None:
        payload["expires_at"] = expires_at.isoformat()
    response = client.post(
        f"/documents/{document_id}/shares",
        headers=owner_headers,
        json=payload,
    )
    assert response.status_code == 201, response.text
    return response.json()


def audit_actions(session, document_id):
    return [
        row.action
        for row in session.query(AuditLog)
        .filter(AuditLog.document_id == document_id)
        .order_by(AuditLog.id)
        .all()
    ]


def test_valid_login_returns_a_bearer_token(client):
    register_user(client, "login@example.com")

    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_missing_and_invalid_tokens_are_rejected(client):
    missing = client.get("/documents")
    invalid = client.get("/documents", headers={"Authorization": "Bearer invalid"})

    assert missing.status_code == 403
    assert invalid.status_code == 401


def test_owner_can_upload_view_and_download_a_pdf(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    document = upload_pdf(client, owner_headers)

    view = client.get(f"/documents/{document['id']}/view", headers=owner_headers)
    download = client.get(f"/documents/{document['id']}/download", headers=owner_headers)

    assert view.status_code == 200
    assert view.headers["content-type"].startswith("application/pdf")
    assert "inline" in view.headers["content-disposition"]
    assert view.content == PDF_BYTES
    assert download.status_code == 200
    assert "attachment" in download.headers["content-disposition"]
    assert download.content == PDF_BYTES


def test_unrelated_user_cannot_access_an_owners_document(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, stranger_headers = create_user(client, "stranger@example.com", "Stranger")
    document = upload_pdf(client, owner_headers)

    view = client.get(f"/documents/{document['id']}/view", headers=stranger_headers)
    download = client.get(f"/documents/{document['id']}/download", headers=stranger_headers)

    assert view.status_code == 404
    assert download.status_code == 404


def test_view_recipient_can_view_but_cannot_download(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, viewer_headers = create_user(client, "viewer@example.com", "Viewer")
    document = upload_pdf(client, owner_headers)
    grant_share(client, owner_headers, document["id"], "viewer@example.com", "VIEW")

    view = client.get(f"/documents/{document['id']}/view", headers=viewer_headers)
    download = client.get(f"/documents/{document['id']}/download", headers=viewer_headers)

    assert view.status_code == 200
    assert view.content == PDF_BYTES
    assert download.status_code == 404


def test_download_recipient_can_view_and_download(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, recipient_headers = create_user(client, "downloader@example.com", "Downloader")
    document = upload_pdf(client, owner_headers)
    grant_share(client, owner_headers, document["id"], "downloader@example.com", "DOWNLOAD")

    view = client.get(f"/documents/{document['id']}/view", headers=recipient_headers)
    download = client.get(f"/documents/{document['id']}/download", headers=recipient_headers)

    assert view.status_code == 200
    assert download.status_code == 200
    assert view.content == download.content == PDF_BYTES


def test_expired_share_cannot_view_or_download(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, recipient_headers = create_user(client, "expired@example.com", "Expired")
    document = upload_pdf(client, owner_headers)
    grant_share(
        client,
        owner_headers,
        document["id"],
        "expired@example.com",
        "DOWNLOAD",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    view = client.get(f"/documents/{document['id']}/view", headers=recipient_headers)
    download = client.get(f"/documents/{document['id']}/download", headers=recipient_headers)

    assert view.status_code == 404
    assert download.status_code == 404


def test_revoked_share_loses_view_and_download_access(client):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, recipient_headers = create_user(client, "revoked@example.com", "Revoked")
    document = upload_pdf(client, owner_headers)
    share = grant_share(
        client,
        owner_headers,
        document["id"],
        "revoked@example.com",
        "DOWNLOAD",
    )

    assert client.get(f"/documents/{document['id']}/view", headers=recipient_headers).status_code == 200
    assert client.get(f"/documents/{document['id']}/download", headers=recipient_headers).status_code == 200

    revoke = client.delete(
        f"/documents/{document['id']}/shares/{share['id']}",
        headers=owner_headers,
    )
    assert revoke.status_code == 200

    assert client.get(f"/documents/{document['id']}/view", headers=recipient_headers).status_code == 404
    assert client.get(f"/documents/{document['id']}/download", headers=recipient_headers).status_code == 404


@pytest.mark.parametrize(
    ("method", "path_suffix", "payload"),
    [
        ("get", "/verify", None),
        ("get", "/shares", None),
        ("post", "/shares", {"recipient_email": "recipient@example.com", "permission": "VIEW"}),
        ("delete", "/shares/99999", None),
    ],
    ids=["verify", "list-shares", "create-share", "revoke-share"],
)
def test_unrelated_user_cannot_perform_owner_only_operations(
    client,
    method,
    path_suffix,
    payload,
):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, stranger_headers = create_user(client, "stranger@example.com", "Stranger")
    register_user(client, "recipient@example.com", "Recipient")
    document = upload_pdf(client, owner_headers)

    request = getattr(client, method)
    kwargs = {"headers": stranger_headers}
    if payload is not None:
        kwargs["json"] = payload
    response = request(f"/documents/{document['id']}{path_suffix}", **kwargs)

    assert response.status_code == 404


@pytest.mark.parametrize(
    "filename,content,content_type,expected_status",
    [
        ("empty.pdf", b"", "application/pdf", 400),
        ("not-a-pdf.txt", PDF_BYTES, "application/pdf", 415),
        ("wrong-type.pdf", PDF_BYTES, "text/plain", 415),
        ("", PDF_BYTES, "application/pdf", 422),
    ],
    ids=["empty-file", "non-pdf-extension", "invalid-mime-type", "missing-filename"],
)
def test_upload_validation_rejects_invalid_files(
    client,
    filename,
    content,
    content_type,
    expected_status,
):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")

    response = client.post(
        "/documents/upload",
        headers=owner_headers,
        files={"file": (filename, content, content_type)},
    )

    assert response.status_code == expected_status


def test_successful_operations_create_expected_audit_events(client, session):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, recipient_headers = create_user(client, "recipient@example.com", "Recipient")
    document = upload_pdf(client, owner_headers)

    assert client.get(f"/documents/{document['id']}/view", headers=owner_headers).status_code == 200
    assert client.get(f"/documents/{document['id']}/download", headers=owner_headers).status_code == 200
    assert client.get(f"/documents/{document['id']}/verify", headers=owner_headers).status_code == 200
    share = grant_share(
        client,
        owner_headers,
        document["id"],
        "recipient@example.com",
        "VIEW",
    )
    assert client.delete(
        f"/documents/{document['id']}/shares/{share['id']}",
        headers=owner_headers,
    ).status_code == 200
    assert client.get(f"/documents/{document['id']}/view", headers=recipient_headers).status_code == 404

    actions = audit_actions(session, document["id"])
    assert actions.count("UPLOAD") == 1
    assert actions.count("VIEW") == 1
    assert actions.count("DOWNLOAD") == 1
    assert actions.count("VERIFY") == 1
    assert actions.count("SHARE") == 1
    assert actions.count("REVOKE_SHARE") == 1


def test_denied_view_and_download_do_not_create_success_audit_events(client, session):
    _, owner_headers = create_user(client, "owner@example.com", "Owner")
    _, stranger_headers = create_user(client, "stranger@example.com", "Stranger")
    document = upload_pdf(client, owner_headers)
    before = audit_actions(session, document["id"])

    assert client.get(f"/documents/{document['id']}/view", headers=stranger_headers).status_code == 404
    assert client.get(f"/documents/{document['id']}/download", headers=stranger_headers).status_code == 404

    assert audit_actions(session, document["id"]) == before
