import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Date;

public class DateUtils {
    
    private DateUtils() {}

    // Common date patterns
    public static final String DATE_PATTERN = "yyyy-MM-dd";
    public static final String DATETIME_PATTERN = "yyyy-MM-dd HH:mm:ss";
    public static final String ISO_DATETIME_PATTERN = "yyyy-MM-dd'T'HH:mm:ss";
    public static final String DISPLAY_DATE_PATTERN = "dd/MM/yyyy";
    public static final String DISPLAY_DATETIME_PATTERN = "dd/MM/yyyy HH:mm:ss";

    // Formatters
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(DATE_PATTERN);
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern(DATETIME_PATTERN);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Get current LocalDateTime
     */
    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    /**
     * Get current LocalDate
     */
    public static LocalDate today() {
        return LocalDate.now();
    }

    /**
     * Format LocalDateTime to string
     */
    public static String format(LocalDateTime dateTime, String pattern) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * Format LocalDate to string
     */
    public static String format(LocalDate date, String pattern) {
        if (date == null) {
            return null;
        }
        return date.format(DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * Format LocalDateTime to default pattern (yyyy-MM-dd HH:mm:ss)
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return format(dateTime, DATETIME_PATTERN);
    }

    /**
     * Format LocalDate to default pattern (yyyy-MM-dd)
     */
    public static String formatDate(LocalDate date) {
        return format(date, DATE_PATTERN);
    }

    /**
     * Parse string to LocalDateTime
     */
    public static LocalDateTime parseDateTime(String dateTimeStr, String pattern) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern(pattern));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * Parse string to LocalDate
     */
    public static LocalDate parseDate(String dateStr, String pattern) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(pattern));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * Parse string to LocalDateTime with default pattern
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        return parseDateTime(dateTimeStr, DATETIME_PATTERN);
    }

    /**
     * Parse string to LocalDate with default pattern
     */
    public static LocalDate parseDate(String dateStr) {
        return parseDate(dateStr, DATE_PATTERN);
    }

    /**
     * Parse ISO string to LocalDateTime
     */
    public static LocalDateTime parseIsoDateTime(String isoDateTimeStr) {
        if (isoDateTimeStr == null || isoDateTimeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(isoDateTimeStr, ISO_FORMATTER);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * Convert Date to LocalDateTime
     */
    public static LocalDateTime toLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }

    /**
     * Convert LocalDateTime to Date
     */
    public static Date toDate(LocalDateTime localDateTime) {
        if (localDateTime == null) {
            return null;
        }
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    /**
     * Convert LocalDate to Date
     */
    public static Date toDate(LocalDate localDate) {
        if (localDate == null) {
            return null;
        }
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    /**
     * Add days to LocalDateTime
     */
    public static LocalDateTime addDays(LocalDateTime dateTime, long days) {
        return dateTime != null ? dateTime.plusDays(days) : null;
    }

    /**
     * Add hours to LocalDateTime
     */
    public static LocalDateTime addHours(LocalDateTime dateTime, long hours) {
        return dateTime != null ? dateTime.plusHours(hours) : null;
    }

    /**
     * Add minutes to LocalDateTime
     */
    public static LocalDateTime addMinutes(LocalDateTime dateTime, long minutes) {
        return dateTime != null ? dateTime.plusMinutes(minutes) : null;
    }

    /**
     * Calculate days between two dates
     */
    public static long daysBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return 0;
        }
        return ChronoUnit.DAYS.between(startDate, endDate);
    }

    /**
     * Calculate hours between two datetimes
     */
    public static long hoursBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        return ChronoUnit.HOURS.between(start, end);
    }

    /**
     * Calculate minutes between two datetimes
     */
    public static long minutesBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(start, end);
    }

    /**
     * Calculate seconds between two datetimes
     */
    public static long secondsBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        return ChronoUnit.SECONDS.between(start, end);
    }

    /**
     * Check if date is in the past
     */
    public static boolean isPast(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isBefore(LocalDateTime.now());
    }

    /**
     * Check if date is in the future
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isAfter(LocalDateTime.now());
    }

    /**
     * Check if date is today
     */
    public static boolean isToday(LocalDate date) {
        return date != null && date.equals(LocalDate.now());
    }

    /**
     * Get start of day
     */
    public static LocalDateTime startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    /**
     * Get end of day
     */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date != null ? date.atTime(23, 59, 59, 999999999) : null;
    }

    /**
     * Get timestamp in milliseconds
     */
    public static long getTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * Get timestamp from LocalDateTime
     */
    public static long getTimestamp(LocalDateTime dateTime) {
        if (dateTime == null) {
            return 0;
        }
        return dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    /**
     * Convert timestamp to LocalDateTime
     */
    public static LocalDateTime fromTimestamp(long timestamp) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
    }

    /**
     * Check if date is weekend
     */
    public static boolean isWeekend(LocalDate date) {
        if (date == null) {
            return false;
        }
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    /**
     * Get age from birthdate
     */
    public static int calculateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return 0;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    /**
     * Format duration in human readable format
     */
    public static String formatDuration(Duration duration) {
        if (duration == null) {
            return "";
        }
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();
        
        if (hours > 0) {
            return String.format("%d hours %d minutes", hours, minutes);
        } else if (minutes > 0) {
            return String.format("%d minutes %d seconds", minutes, seconds);
        } else {
            return String.format("%d seconds", seconds);
        }
    }

    /**
     * Get relative time string (e.g., "2 hours ago", "in 3 days")
     */
    public static String getRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long seconds = ChronoUnit.SECONDS.between(dateTime, now);
        
        if (seconds < 0) {
            // Future
            seconds = Math.abs(seconds);
            if (seconds < 60) return "in " + seconds + " seconds";
            if (seconds < 3600) return "in " + (seconds / 60) + " minutes";
            if (seconds < 86400) return "in " + (seconds / 3600) + " hours";
            return "in " + (seconds / 86400) + " days";
        } else {
            // Past
            if (seconds < 60) return seconds + " seconds ago";
            if (seconds < 3600) return (seconds / 60) + " minutes ago";
            if (seconds < 86400) return (seconds / 3600) + " hours ago";
            return (seconds / 86400) + " days ago";
        }
    }
}
