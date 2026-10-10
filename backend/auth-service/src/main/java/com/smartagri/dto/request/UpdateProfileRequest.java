package com.smartagri.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private String location;
    private String farmSize;
}
