package gateway.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import jakarta.annotation.PostConstruct;

@Service
public class StripeService {
    private static final Logger log = LoggerFactory.getLogger(StripeService.class);
    
    @Value("${stripe.secret.key}")
    private String stripeSecretKey;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        log.info("Stripe service initialized with API key (length: {})", 
            stripeSecretKey != null ? stripeSecretKey.length() : 0);
    }
    
    /**
     * Create a Stripe PaymentIntent
     * @param amount the amount in dollars (will be converted to cents)
     * @param currency the currency code (default: usd)
     * @param orderId the order ID for metadata
     * @param userId the user ID for metadata
     * @return the created PaymentIntent
     * @throws StripeException if Stripe API call fails
     */
    public PaymentIntent createPaymentIntent(double amount, String currency, Integer orderId, Integer userId) 
            throws StripeException {
        log.info("Creating Stripe payment intent - amount: {}, currency: {}, orderId: {}, userId: {}", 
            amount, currency, orderId, userId);
        
        // Convert amount to cents (Stripe uses smallest currency unit)
        long amountInCents = Math.round(amount * 100);
        
        PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
            .setAmount(amountInCents)
            .setCurrency(currency.toLowerCase())
            .setAutomaticPaymentMethods(
                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build())
            .putMetadata("userId", String.valueOf(userId));
        
        if (orderId != null) {
            paramsBuilder.putMetadata("orderId", String.valueOf(orderId));
        }
        
        PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());
        
        log.info("Stripe payment intent created successfully - paymentIntentId: {}, amount: {} {}", 
            paymentIntent.getId(), amount, currency);
        
        return paymentIntent;
    }
    
    /**
     * Retrieve a Stripe PaymentIntent by ID
     * @param paymentIntentId the Stripe payment intent ID
     * @return the PaymentIntent
     * @throws StripeException if Stripe API call fails
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException {
        log.info("Retrieving Stripe payment intent - paymentIntentId: {}", paymentIntentId);
        return PaymentIntent.retrieve(paymentIntentId);
    }
}
