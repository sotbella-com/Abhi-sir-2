import { LoadingButton } from "@/components/atoms";
import { Modal, Button } from "antd";
import { useEffect, useState } from "react";

const ExchangeProductModal = ({
  open,
  onCancel,
  onConfirm,
  setExchangeType,
  isBogoOrder = false,
}) => {
  const [option, setOption] = useState(null);

  // reset selection each time modal opens
  useEffect(() => {
    if (open) setOption(null);
  }, [open]);

  const handleConfirm = () => {
    if (!option) return;

    if (option === "size") {
      setExchangeType?.("SAME_ITEM_DIFFERENT_SIZE");
    } else if (option === "product") {
      setExchangeType?.("PRODUCT_EXCHANGE");
    }

    // close modal from parent
    onConfirm?.(option);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      closable
      width={720}
      title={<span style={{ fontWeight: 700, letterSpacing: "0.5px" }}>EXCHANGE PRODUCT</span>}
      bodyStyle={{ paddingTop: 18 }}
    >
      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Option 1 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOption("size")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOption("size")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
            padding: "4px 2px",
          }}
        >
          <span style={{ fontSize: 14, width: "90%" }}>
            Do you want to Exchange with different Size of same Item
          </span>

          {/* Right side circle */}
          <span
            style={{
              width: 18,
              height: 18,
              border: "1px solid #000",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {option === "size" ? (
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: "#000",
                  borderRadius: "50%",
                }}
              />
            ) : null}
          </span>
        </div>

        {/* Option 2 */}
        {!isBogoOrder && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOption("product")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOption("product")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
              padding: "4px 2px",
            }}
          >
            <span style={{ fontSize: 14, width: "90%" }}>
              Do you want to Exchange with different Product
            </span>

            {/* Right side circle */}
            <span
              style={{
                width: 18,
                height: 18,
                border: "1px solid #000",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {option === "product" ? (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "#000",
                    borderRadius: "50%",
                  }}
                />
              ) : null}
            </span>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          marginTop: 28,
        }}
      >
        <Button
          onClick={onCancel}
          style={{
            width: "50%",
            borderRadius: 0,
            height: 48,
            border: "1px solid #000",
            fontWeight: 500,
          }}
        >
          CANCEL
        </Button>

        <LoadingButton
          onClick={handleConfirm}
          disabled={!option}
          style={{
            width: "50%",
            borderRadius: 0,
            height: 48,
            background: "#000",
            border: "1px solid #000",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          CONFIRM
        </LoadingButton>
      </div>
    </Modal>
  );
};

export default ExchangeProductModal;
