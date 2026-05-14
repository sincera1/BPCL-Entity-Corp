import * as React from "react";
import { Modal, Carousel } from "react-bootstrap";
import styles from "../components/BpclEntityHome.module.scss";

interface IBroadcastPreviewItem {
  Title: string;
  EventDate?: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  item?: IBroadcastPreviewItem;
  attachments?: { FileName: string; ServerRelativeUrl: string }[];
}

const PreviewBroadcastModal: React.FC<Props> = ({
  show,
  onClose,
  item,
  attachments = [],
}) => {
  if (!item) return null;

  // Helpers
  const isImage = (fileName: string):boolean  =>
    /\.(png|jpe?g|gif)$/i.test(fileName);

  const isPdf = (fileName: string):boolean  =>
    /\.pdf$/i.test(fileName);

  // Separate attachments
  const imageAttachments = attachments.filter(a =>
    isImage(a.FileName)
  );

  const pdfAttachments = attachments.filter(a =>
    isPdf(a.FileName)
  );

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>{item.Title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>
        {/* ================= IMAGES ================= */}

        {/* Single Image */}
        {imageAttachments.length === 1 && (
          <img
            src={imageAttachments[0].ServerRelativeUrl}
            alt="Broadcast"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              marginBottom: "16px",
            }}
          />
        )}

        {/* Multiple Images → Carousel */}
        {imageAttachments.length > 1 && (
          <Carousel  className={`mb-3 ${styles.modalCarousel}`}>
            {imageAttachments.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  src={img.ServerRelativeUrl}
                  alt={img.FileName}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* ================= TITLE ================= */}
        {/* <h5 className="mb-2">{item.Title}</h5> */}

        {/* ================= EVENT DATE ================= */}
        <p className="mb-3 text-muted">

          {item.EventDate && (
            <p className="mb-3 text-muted">
              {new Date(item.EventDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </p>

        {/* ================= PDF ATTACHMENTS ================= */}
        {pdfAttachments.length > 0 && (
          <div className="mt-3">
            <h6>Attachments</h6>
            <ul className="list-unstyled">
              {pdfAttachments.map((pdf, index) => (
                <li key={index}>
                  <a
                    href={pdf.ServerRelativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 {pdf.FileName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal.Body>

      {/* <Modal.Footer>
        <Button variant="outline-primary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer> */}
    </Modal>
  );
};

export default PreviewBroadcastModal;