import { useState } from "react";
import * as yup from "yup";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { Email, Update } from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../utils/api";

const forgotSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email address.")
    .required("Email is required."),
});

const defaultValues = {
  email: "",
};

const ForgotPassword = () => {
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const validateField = async (field, valueOverride) => {
    if (!forgotSchema.fields[field]) return;
    try {
      await forgotSchema.validateAt(field, {
        ...formValues,
        [field]: valueOverride ?? formValues[field],
      });
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, [field]: error.message }));
    }
  };

  const validateForm = async () => {
    try {
      await forgotSchema.validate(formValues, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      const formattedErrors = error.inner.reduce((acc, current) => {
        if (current.path && !acc[current.path]) {
          acc[current.path] = current.message;
        }
        return acc;
      }, {});
      setFormErrors((prev) => ({ ...prev, ...formattedErrors }));
      return false;
    }
  };

  const handleChange = async (event) => {
    const { name, value, checked, type } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormValues((prev) => ({ ...prev, [name]: nextValue }));
    await validateField(name, nextValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setSubmitting(true);
    setStatus(null);
    setErrorMessage("");

    try {
      const response = await authApi.forgotPassword({
        email: formValues.email,
      });

      setSubmitting(false);
      setStatus("sent");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to send reset code. Please try again.");
      setStatus("error");
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset access link"
      subtitle="Enter the email linked to your auction account. We’ll send a secure recovery link."
      icon={<Update color="primary" fontSize="large" />}
      footerLinks={[
        { label: "Back to login", to: "/auth/login" },
        { label: "Create a new account", to: "/auth/register" },
      ]}
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        {status === "sent" && (
          <Alert severity="success" sx={{ py: 1 }}>
            We emailed a reset code to {formValues.email}. It expires in 10 minutes. Please check your email and use the code to reset your password.
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ py: 1 }}>
            {errorMessage}
          </Alert>
        )}

        <TextField
          label="Email address"
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.email)}
          helperText={formErrors.email}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Sending link..." : "Send reset link"}
        </Button>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Email color="primary" />
          <Typography variant="body2" color="text.secondary">
            Check spam folders if you do not see the message. Links only work
            once for security reasons.
          </Typography>
        </Box>
      </Stack>
    </AuthLayout>
  );
};

export default ForgotPassword;