import imaplib
import email
from email.header import decode_header
import re

def fetch_real_emails(email_address: str, app_password: str, host: str = "imap.gmail.com") -> list:
    """Connects to IMAP and fetches the last 10 emails, returning them as a list of dicts."""
    try:
        # Connect to the server
        mail = imaplib.IMAP4_SSL(host)
        mail.login(email_address, app_password)
        mail.select("inbox")

        # Search for all emails in inbox
        status, messages = mail.search(None, "ALL")
        if status != "OK":
            return []

        # Get list of email IDs, we want the last 30 (most recent)
        email_ids = messages[0].split()
        latest_email_ids = email_ids[-30:]

        emails_data = []

        for e_id in reversed(latest_email_ids):
            # Fetch the email data
            res, msg_data = mail.fetch(e_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    # Parse the raw email bytes into a message object
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Decode the email subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        # if it's a bytes, decode to str
                        subject = subject.decode(encoding if encoding else "utf-8", errors='ignore')
                    
                    # Extract the sender
                    from_ = msg.get("From", "Unknown")
                    date_ = msg.get("Date", "Unknown")
                    
                    # Extract the body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition"))
                            
                            try:
                                if content_type == "text/plain" and "attachment" not in content_disposition:
                                    part_body = part.get_payload(decode=True).decode(errors='ignore')
                                    body += part_body
                            except Exception:
                                pass
                    else:
                        content_type = msg.get_content_type()
                        if content_type == "text/plain":
                            try:
                                body = msg.get_payload(decode=True).decode(errors='ignore')
                            except Exception:
                                pass
                                
                    # --- PRIVACY FILTER LAYER ---
                    # Redact content from non-work related sources (social media, shopping, etc.)
                    from_lower = from_.lower()
                    privacy_keywords = [
                        "instagram.com", "facebook.com", "twitter.com", "x.com", 
                        "amazon.", "target.com", "walmart.com", "flipkart.com", "myntra.com",
                        "netflix.com", "spotify.com", "uber.com", "swiggy.com", "zomato.com",
                        "youtube.com", "tiktok.com", "pinterest.com", "reddit.com",
                        "marketing@", "promotions@", "newsletter@", "no-reply@"
                    ]
                    
                    is_personal = any(kw in from_lower for kw in privacy_keywords) or any(kw in subject.lower() for kw in privacy_keywords)
                    
                    if is_personal:
                        body = "[PRIVACY FILTER] Personal/Social email detected. Content redacted for user privacy. (Vantage Enterprise Security)"
                        subject = "[Redacted] Personal/Social Notification"
                        from_ = "[Redacted] (Private Sender)"
                    else:
                        # Clean up the body to avoid massive text blocks
                        body = re.sub(r'\s+', ' ', body).strip()
                        body = body[:5000] # Limit to 5000 chars per email
                    
                    emails_data.append({
                        "subject": subject or "No Subject",
                        "from": from_,
                        "body": body,
                        "date": date_
                    })
                    
        mail.close()
        mail.logout()
        return emails_data

    except Exception as e:
        print("IMAP Fetch Error:", e)
        return []
