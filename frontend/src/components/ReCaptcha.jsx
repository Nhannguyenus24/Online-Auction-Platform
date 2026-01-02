import { useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Box } from "@mui/material";

const ReCaptcha = ({ onChange, onExpired, siteKey, resetRef, ...props }) => {
  const recaptchaRef = useRef(null);

  // Reset reCAPTCHA when component unmounts or when explicitly needed
  const reset = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // Expose reset method via ref if needed
  useEffect(() => {
    if (resetRef) {
      resetRef.current = { reset };
    }
  }, [resetRef]);

  const handleChange = (value) => {
    onChange(value);
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
    onChange(null);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
        onChange={handleChange}
        onExpired={handleExpired}
        {...props}
      />
    </Box>
  );
};

export default ReCaptcha;

