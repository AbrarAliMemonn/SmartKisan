package com.smartagri.service;

import com.smartagri.dto.request.PaymentAccountRequest;
import com.smartagri.dto.response.PaymentAccountResponse;

import java.util.List;

public interface PaymentAccountService {
    PaymentAccountResponse create(Long ownerUserId, PaymentAccountRequest request);
    List<PaymentAccountResponse> getMyAccounts(Long ownerUserId);
    PaymentAccountResponse update(Long id, Long ownerUserId, PaymentAccountRequest request);
    void deactivate(Long id, Long ownerUserId);

    /** Active receiving accounts a buyer may pay into for the given seller (checkout). Falls back to platform accounts if the seller has none. */
    List<PaymentAccountResponse> getActiveAccountsForSeller(Long sellerUserId);
}
