package com.smartagri.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request to email an OTP. Published by the OTP service, consumed by {@code OtpEmailConsumer}. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpEmailEvent {
    private String email;
    private String otp;
    /** OtpPurpose name: EMAIL_VERIFICATION | PASSWORD_RESET */
    private String purpose;
    private long validMinutes;
}
