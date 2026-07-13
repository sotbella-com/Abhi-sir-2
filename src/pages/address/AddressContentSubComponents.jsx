import React, { useEffect } from "react";
import { Box, Stack, Flex, Text, Link } from "@chakra-ui/react";
import { ShimmerCheckout } from "@/components/layouts/Simmers/ShimmerCheckout";


/* ============ black/white inline radio ============ */
export const RadioBW = ({ name, value, checked, onChange, label }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };
  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };
  const ringStyle = {
    width: 16,
    height: 16,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: "50%",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: checked ? "#000" : "transparent",
    transform: checked ? "scale(1)" : "scale(0.1)",
    transition: "transform 120ms ease-in-out, background 120ms ease-in-out",
  };

  return (
    <label style={labelStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span style={ringStyle}>
        <span style={dotStyle} />
      </span>
      {label && <span style={{ fontSize: 14, color: "#000" }}>{label}</span>}
    </label>
  );
};

export const CheckboxBW = ({ id, checked, onChange, label }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };

  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };

  const boxStyle = {
    width: 14,
    height: 14,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: 0,
    background: checked ? "#000" : "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 120ms ease-in-out, border-color 120ms ease-in-out",
  };

  return (
    <label htmlFor={id} style={labelStyle}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span style={boxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5l2 2 5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {label ? <span style={{ fontSize: 14, color: "#343434" }}>{label}</span> : null}
    </label>
  );
};

export const AddressList = ({
  loadingAddresses,
  displaySorted,
  selectedAddressId,
  handleRadioBoxChange,
  urlBasketId,
  openEditAddress,
}) => {
  return (
    <Box>
      {loadingAddresses ? (
        <ShimmerCheckout />
      ) : (
        <Stack spacing={{ base: 2, lg: 3 }}>
          {displaySorted.map((item) => (
            <Box
              key={item.id}
              borderWidth={{ base: "1.5px", lg: "1px" }}
              borderColor={{ base: "black", lg: "#9d9d9d" }}
              borderRadius={{ base: "lg", lg: 0 }}
              boxShadow={{
                base: "0 0 14px rgba(0, 0, 0, 0.24)",
                lg: "none",
              }}
              p={3}
              mb={{ base: 2, lg: 3 }}
            >
              <Flex justify="space-between" align="flex-start">
                <Text
                  fontSize={{ base: "sm", lg: "lg" }}
                  fontWeight="medium"
                  color="black"
                  mb="3px"
                >
                  {item.address}
                </Text>

                <RadioBW
                  name="selectedAddress"
                  value={String(item.id)}
                  checked={String(selectedAddressId) === String(item.id)}
                  onChange={() => handleRadioBoxChange(item.id)}
                  label=""
                />
              </Flex>

              <Text fontSize="sm" color="black" mb="3px">
                {(item.firstName ?? "") + " " + (item.lastName ?? "")}.
              </Text>
              <Text fontSize="sm" color="black" mb="3px">
                {(item.cityName ?? "") + (item.stateName ? `, ${item.stateName}` : "")}
              </Text>

              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="black" mb="3px">
                  {item.phone}
                </Text>

                <Link
                  as="button"
                  type="button"
                  fontSize="xs"
                  opacity={0.5}
                  borderBottom="1px solid"
                  _hover={{ textDecoration: "none", opacity: 0.8 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditAddress(item.id);
                  }}
                >
                  Edit
                </Link>

              </Flex>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export const CustomAddressModal = ({
  isOpen,
  onClose,
  title = "Saved Address",
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end", // bottom sheet
  };

  const sheetStyle = {
    width: "100%",
    maxWidth: "992px",
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
    maxHeight: "92vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transform: "translateY(0)",
    animation: "slideUp 180ms ease-out",
  };

  const headerStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const bodyStyle = {
    padding: 16,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const closeBtnStyle = {
    border: "none",
    background: "transparent",
    padding: 8,
    cursor: "pointer",
    lineHeight: 0,
  };

  return (
    <>
      {/* keyframes */}
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(12px); opacity: 0.96; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>

      <div
        style={overlayStyle}
        onClick={() => onClose?.()} // overlay click closes
      >
        <div
          style={sheetStyle}
          onClick={(e) => e.stopPropagation()} // prevent close when clicking content
          role="dialog"
          aria-modal="true"
        >
          <div style={headerStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>
              {title}
            </div>

            <button style={closeBtnStyle} onClick={() => onClose?.()} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#1D1D1D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div style={bodyStyle}>{children}</div>
        </div>
      </div>
    </>
  );
};

export const DesktopAddressModal = ({
  isOpen,
  onClose,
  title = "Saved Address",
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  };

  const modalStyle = {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    maxHeight: "85vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    animation: "fadeInScale 160ms ease-out",
  };

  const headerStyle = {
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const bodyStyle = {
    padding: 16,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const closeBtnStyle = {
    border: "none",
    background: "transparent",
    padding: 4,
    cursor: "pointer",
    lineHeight: 0,
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInScale {
            from { transform: scale(0.98); opacity: 0.85; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div style={overlayStyle} onClick={() => onClose?.()}>
        <div
          className="scroll-thin"
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div style={headerStyle}>
            <div style={{ fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}>
              {title}
            </div>

            <button style={closeBtnStyle} onClick={() => onClose?.()} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#1D1D1D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="scroll-thin" style={bodyStyle}>{children}</div>
        </div>
      </div>
    </>
  );
};

export const AddAddressModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDesktop = window.matchMedia("(min-width: 992px)").matches;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: isDesktop ? "center" : "flex-end",
  };

  const containerStyle = {
    position: "relative",
    width: "100%",
    maxWidth: isDesktop ? 900 : "100%",
    background: "#fff",
    borderRadius: isDesktop ? 0 : "16px 16px 0 0",
    maxHeight: isDesktop ? "90vh" : "92vh",
    overflow: "hidden",
    boxShadow: isDesktop
      ? "0 20px 60px rgba(0,0,0,0.35)"
      : "0 -10px 30px rgba(0,0,0,0.25)",
    transform: "translateY(0)",
    animation: isDesktop ? "fadeInScale 160ms ease-out" : "slideUp 180ms ease-out",
    display: "flex",
    flexDirection: "column",
  };

  const bodyStyle = {
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    border: "none",
    background: "transparent",
    padding: 8,
    cursor: "pointer",
    lineHeight: 0,
  };

  return (
    <>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(14px); opacity: 0.96; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeInScale {
            from { transform: scale(0.98); opacity: 0.85; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div style={overlayStyle} onClick={() => onClose?.()}>
        <div
          style={containerStyle}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button style={closeBtnStyle} onClick={() => onClose?.()} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#1D1D1D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="scroll-thin" style={bodyStyle}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export const EditAddressModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDesktop = window.matchMedia("(min-width: 992px)").matches;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: isDesktop ? "center" : "flex-end",
  };

  const containerStyle = {
    position: "relative",
    width: "100%",
    maxWidth: isDesktop ? 900 : "100%",
    background: "#fff",
    borderRadius: isDesktop ? 0 : "16px 16px 0 0",
    maxHeight: isDesktop ? "90vh" : "92vh",
    overflow: "hidden",
    boxShadow: isDesktop
      ? "0 20px 60px rgba(0,0,0,0.35)"
      : "0 -10px 30px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
  };

  const bodyStyle = {
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    border: "none",
    background: "transparent",
    padding: 8,
    cursor: "pointer",
    lineHeight: 0,
  };

  return (
    <div style={overlayStyle} onClick={() => onClose?.()}>
      <div
        style={containerStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button style={closeBtnStyle} onClick={() => onClose?.()} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#1D1D1D"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="scroll-thin" style={bodyStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};