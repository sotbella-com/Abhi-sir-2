import { LoadingButton } from "@/components/atoms";
import { Modal, Radio, Button, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

const RefundOrExchangeModal = ({
  open,
  onCancel,
  onExchangeClick,
  onRefundClick,
}) => {
  const [option, setOption] = useState(null);

  const handleConfirm = () => {
    if (option) {
      onConfirm(option);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      closable
      title={<span style={{ fontWeight: "bold" }}>Confirm Return</span>}
    >
      <Typography level={3} style={{ marginBottom: 16 }}>
        You will get 5% on Exchange. Do you want Exchange?
      </Typography>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 32,
        }}
      >
        <Button
          onClick={onRefundClick}
          style={{ width: "48%", borderRadius: 0, height: 50, marginRight: 10 }}
        >
          REFUND
        </Button>
        <LoadingButton onClick={onExchangeClick} text="Exchange" />
      </div>
    </Modal>
  );
};

export default RefundOrExchangeModal;
