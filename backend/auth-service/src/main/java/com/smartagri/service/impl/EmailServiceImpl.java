package com.smartagri.service.impl;

import com.smartagri.entity.OtpPurpose;
import com.smartagri.exception.EmailSendException;
import com.smartagri.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.from-name:Smart Agriculture}")
    private String fromName;

    @Override
    public void sendOtpEmail(String to, String otp, OtpPurpose purpose, long validMinutes) {
        String subject;
        String intro;
        if (purpose == OtpPurpose.PASSWORD_RESET) {
            subject = "Your password reset code";
            intro = "Use the code below to reset your password.";
        } else {
            subject = "Verify your email address";
            intro = "Use the code below to verify your email address.";
        }

        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;\
                border:1px solid #e5e7eb;border-radius:8px">
                  <h2 style="color:#166534;margin-top:0">%s</h2>
                  <p>%s</p>
                  <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;\
                background:#f0fdf4;padding:12px;border-radius:6px">%s</p>
                  <p>This code is valid for %d minutes. Do not share it with anyone.</p>
                  <p style="color:#6b7280;font-size:12px">If you did not request this, you can safely ignore this email.</p>
                </div>
                """.formatted(fromName, intro, otp, validMinutes);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("OTP email ({}) sent to {}", purpose, to);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new EmailSendException("Unable to send email right now. Please try again later.", e);
        }
    }
}
