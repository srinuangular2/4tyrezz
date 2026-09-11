function otpMode() {
  const mode = String(process.env.OTP_MODE || '').toLowerCase();
  if (mode === 'production') return 'production';
  if (mode === 'development') return 'development';
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

function isOtpDevelopment() {
  return otpMode() === 'development';
}

function sanitizeMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

function generateDynamicOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function logDevOtpBanner(mobileNumber, dynamicOtp) {
  const line = '============================================================';
  console.log(`
${line}
[DEV MODE OTP SENT]
Mobile Number: ${mobileNumber}
Dynamic OTP Code: ${dynamicOtp}
Timestamp: ${new Date().toLocaleTimeString()}
${line}
`);
}

module.exports = { otpMode, isOtpDevelopment, sanitizeMobile, generateDynamicOtp, logDevOtpBanner };
