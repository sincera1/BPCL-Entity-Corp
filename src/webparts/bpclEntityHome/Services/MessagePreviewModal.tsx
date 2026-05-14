import * as React from "react";
import { Modal, Row, Col } from "react-bootstrap";
import { IDirectorCornerItem } from "./BpclEntityHomeServices";
import styles from "../components/BpclEntityHome.module.scss";

export interface IMessagePreviewModalProps {
  show: boolean;
  leader?: IDirectorCornerItem ;
  activeImageIndex: number;
  onClose: () => void;
  onThumbnailClick: (index: number) => void;
}

const MessagePreviewModal: React.FC<IMessagePreviewModalProps> = ({
  show,
  leader,
  activeImageIndex,
  onClose,
  onThumbnailClick
}) => {

  if (!show || !leader) return null;

  const images = leader.GalleryImages || [];
  const selectedImage = images[activeImageIndex];

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Body style={{ position: "relative" }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "transparent",
            fontSize: 18,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          ✕
        </button>

        <Row>
          {/* LEFT : Images */}
          <Col md={5}>
            {selectedImage && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <img
                  src={selectedImage}
                  alt={leader.Title}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap"
              }}
            >
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`thumb-${index}`}
                  style={{
                    width: 70,
                    height: 50,
                    objectFit: "cover",
                    cursor: "pointer",
                    border:
                      activeImageIndex === index
                        ? "3px solid #0078d4"
                        : "2px solid #ddd",
                    borderRadius: 6
                  }}
                  onClick={() => onThumbnailClick(index)}
                />
              ))}
            </div>
          </Col>

          {/* RIGHT : Content */}
          <Col md={7} className="py-2">
            <div className={styles.modalMessageSection}>
              <h2 className={styles.leaderName}>{leader.Title}</h2>
              <h6 className={styles.designation}>{leader.Designation}</h6>
              {/* <p className={styles.modalmessageText}>{leader.Message}</p> */}
              <p>{leader.Message}</p>
            </div>
          </Col>
        </Row>

      </Modal.Body>
    </Modal>
  );
};

export default MessagePreviewModal;