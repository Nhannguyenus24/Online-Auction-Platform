package notification.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.auction.config.ConfigConstants;

/**
 * Configuration for email template processing using Thymeleaf.
 *
 * Configures:
 * - Thymeleaf template engine for rendering email templates
 * - HTML template resolution from classpath
 * - Template caching for performance
 * - Character encoding for proper internationalization
 *
 * Template location: classpath:templates/
 * Template files: *.html
 *
 * Usage example:
 * ```
 * @Autowired
 * private TemplateEngine templateEngine;
 *
 * Context context = new Context();
 * context.setVariable("userName", "John Doe");
 * String emailBody = templateEngine.process("email-template", context);
 * ```
 *
 * Available email templates:
 * - verification-email.html
 * - password-reset-email.html
 * - notification-email.html
 * - order-confirmation-email.html
 */
@Configuration
public class EmailConfig {
    private static final Logger log = LoggerFactory.getLogger(EmailConfig.class);

    /**
     * Creates and configures the Thymeleaf template engine for email rendering.
     *
     * Features:
     * - HTML template mode support
     * - UTF-8 character encoding for international characters
     * - Template caching enabled for performance
     * - Classpath-based template resolution
     *
     * @return Configured Thymeleaf TemplateEngine
     */
    @Bean
    public TemplateEngine emailTemplateEngine() {
        log.info("Initializing email template engine");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(htmlTemplateResolver());
        log.debug("Email template engine initialized with HTML template resolver");
        return engine;
    }

    /**
     * Configures the Thymeleaf template resolver for HTML email templates.
     *
     * Configuration:
     * - Location: classpath:templates/ (resolved from src/main/resources)
     * - File extension: .html
     * - Template mode: HTML5
     * - Character encoding: UTF-8 (supports international characters)
     * - Caching: enabled for production performance
     *
     * Template resolution example:
     * - Template name: "user-verification"
     * - Resolves to: classpath:templates/user-verification.html
     *
     * @return Configured ClassLoaderTemplateResolver
     */
    private ClassLoaderTemplateResolver htmlTemplateResolver() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();

        // Set template location relative to classpath
        resolver.setPrefix(ConfigConstants.Email.TEMPLATE_PREFIX);

        // Set template file extension
        resolver.setSuffix(ConfigConstants.Email.TEMPLATE_SUFFIX);

        // Set template processing mode to HTML5
        resolver.setTemplateMode(TemplateMode.HTML);

        // Set character encoding for proper internationalization support
        resolver.setCharacterEncoding(ConfigConstants.Email.CHARACTER_ENCODING);

        // Enable caching for improved performance in production
        resolver.setCacheable(ConfigConstants.Email.TEMPLATE_CACHEABLE);

        log.debug("HTML template resolver configured: prefix={}, suffix={}, encoding={}",
            ConfigConstants.Email.TEMPLATE_PREFIX,
            ConfigConstants.Email.TEMPLATE_SUFFIX,
            ConfigConstants.Email.CHARACTER_ENCODING);

        return resolver;
    }
}
