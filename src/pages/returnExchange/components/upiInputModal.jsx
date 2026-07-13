import { LoadingButton } from "@/components/atoms";
import { Modal, Radio, Button, Typography, Input } from "antd";
import { useState } from "react";

const UpiInputModal = ({ open, onCancel, onConfirm }) => {
  const [upi, setUpi] = useState("");

  const handleConfirm = () => {
    onConfirm(upi);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      closable
      title={<span style={{ fontWeight: "bold" }}>Enter UPI</span>}
    >
      <Input
        name="upi"
        value={upi}
        onChange={(e) => setUpi(e.target.value)}
        type="text"
        placeholder="UPI Id"
        style={{ border: "1px solid #ccc", marginBottom: 8, height: 50 }}
        required
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <Button
          onClick={onCancel}
          style={{ width: "48%", borderRadius: 0, height: 50, marginRight: 10 }}
        >
          CANCEL
        </Button>
        <LoadingButton onClick={handleConfirm} text="Confirm" />
      </div>
    </Modal>
  );
};

export default UpiInputModal;
