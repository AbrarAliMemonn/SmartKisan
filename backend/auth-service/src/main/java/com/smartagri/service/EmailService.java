package com.smartagri.service;

import com.smartagri.entity.OtpPurpose;

public interface EmailService {
    /** Sends the OTP mail. Throws EmailSendException when delivery fails. */
    void sendOtpEmail(String to, String otp, OtpPurpose purpose, long validMinutes);
}
