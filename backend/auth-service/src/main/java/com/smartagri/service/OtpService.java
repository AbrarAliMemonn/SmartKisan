package com.smartagri.service;

import com.smartagri.entity.OtpPurpose;

public interface OtpService {

    /** Creates a fresh OTP (replacing any previous one) and emails it. */
    void generateAndSend(String email, OtpPurpose purpose);

    /**
     * Checks the OTP. Returns normally and consumes the OTP when valid,
     * throws BadRequestException otherwise.
     */
    void verify(String email, OtpPurpose purpose, String otp);
}
