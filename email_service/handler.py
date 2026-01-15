import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(event, context):
    """
    AWS Lambda handler for sending emails.
    Expected payload:
    {
        "action": "SIGNUP_WELCOME" | "BOOKING_CONFIRMATION",
        "to_email": "recipient@example.com",
        ... other fields based on action
    }
    """
    try:
        # Parse body
        body = json.loads(event.get('body', '{}'))
        
        action = body.get('action')
        to_email = body.get('to_email')
        
        if not action or not to_email:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing action or to_email'})
            }
        
        # Get email content based on action
        subject, html_content = get_email_content(action, body)
        
        if not subject:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid action'})
            }
            
        # Send email
        success = send_smtp_email(to_email, subject, html_content)
        
        if success:
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Email sent successfully'})
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to send email'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_email_content(action, data):
    """Generate email subject and body based on action."""
    if action == 'SIGNUP_WELCOME':
        subject = 'Welcome to HMS - Your Healthcare Partner'
        name = data.get('user_name', 'User')
        role = data.get('role', 'member')
        
        html_content = f"""
        <html>
            <body>
                <h2>Welcome to HMS!</h2>
                <p>Hi {name},</p>
                <p>Thank you for joining Hospital Management System as a {role}.</p>
                <p>We are excited to have you on board. You can now login to your dashboard to:</p>
                <ul>
                    {'<li>Manage your availability and appointments</li>' if role == 'doctor' else '<li>Book appointments with top doctors</li>'}
                    {'<li>View patient history</li>' if role == 'doctor' else '<li>Track your medical history</li>'}
                </ul>
                <p>Best regards,<br>The HMS Team</p>
            </body>
        </html>
        """
        return subject, html_content
        
    elif action == 'BOOKING_CONFIRMATION':
        subject = 'Appointment Confirmation - HMS'
        patient_name = data.get('patient_name', 'Patient')
        doctor_name = data.get('doctor_name', 'Doctor')
        date = data.get('appointment_date', '')
        time = data.get('appointment_time', '')
        
        # Determine if this email is for patient or doctor (simplified to patient for now)
        # In a real app, you might want to send two emails or have a flag
        
        html_content = f"""
        <html>
            <body>
                <h2>Appointment Confirmed</h2>
                <p>Dear {patient_name},</p>
                <p>Your appointment has been successfully booked.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>Doctor:</strong> {doctor_name}</p>
                    <p><strong>Date:</strong> {date}</p>
                    <p><strong>Time:</strong> {time}</p>
                </div>
                <p>Please arrive 10 minutes early.</p>
                <p>Best regards,<br>The HMS Team</p>
            </body>
        </html>
        """
        return subject, html_content
        
    return None, None

def send_smtp_email(to_email, subject, html_content):
    """Send email using SMTP."""
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not smtp_user or not smtp_password:
        print("SMTP credentials not configured. Mocking email send.")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False
