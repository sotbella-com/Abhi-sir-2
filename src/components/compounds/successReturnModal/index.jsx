import { Modal, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { LoadingButton } from "@/components/atoms";
import { handleNavigate } from "@/utils/url";

const { Title, Text, Paragraph } = Typography;

const SuccessReturnModal = ({ open, onClose, data }) => {
  // `data` example: { type: 'RETURN' | 'EXCHANGE', id: 'RE123456', items: [...], date: '2025-05-17' }

  const titleText =
    data?.type === "RETURN"
      ? "Return Initiated Successfully"
      : "Exchange Initiated Successfully";
  const idLabel = data?.type === "RETURN" ? "Return ID" : "Exchange ID";

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width={500}>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <CheckCircleOutlined style={{ fontSize: "48px", color: "#52c41a" }} />
        <Title level={3} style={{ marginTop: 16 }}>
          {titleText}
        </Title>

        <Paragraph>
          {idLabel}: <Text strong>{data?.id}</Text>
        </Paragraph>

        <Paragraph type="secondary">
          We’ve received your request. Our team will review it shortly. You’ll
          be notified once it is processed.
        </Paragraph>

        <div style={{ textAlign: "left", marginTop: 24 }}>
          <Title level={5}>Details:</Title>
          <ul style={{ paddingLeft: 20 }}>
            <li>Type: {data?.type}</li>
            <li>Date: {data?.date}</li>
            <li>Items: {data?.items?.length || 0} selected</li>
          </ul>
        </div>
      </div>

      <LoadingButton
        onClick={() => handleNavigate("/", "_self")}
        text="Go To Home Page"
      />
    </Modal>
  );
};

export default SuccessReturnModal;
