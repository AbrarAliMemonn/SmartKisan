package com.smartagri.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SellerRegistrationRequest {

    @NotBlank(message = "Shop name is required")
    private String shopName;

    private String description;

    private String storeLogoUrl;

    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    private String address;

    private String city;

    private String province;

    /** Legacy free-text location, kept for backward compatibility with existing clients. */
    private String location;

    /** INDIVIDUAL_FARMER / AGRICULTURAL_BUSINESS / MANUFACTURER / DISTRIBUTOR / RETAILER / WHOLESALER */
    @NotBlank(message = "Seller type is required")
    private String sellerType;
}
