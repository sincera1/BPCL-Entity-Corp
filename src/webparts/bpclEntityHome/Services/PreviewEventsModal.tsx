import * as React from "react";
import {  Carousel, Modal } from "react-bootstrap";
import styles from "../components/BpclEntityHome.module.scss";
import { IEventPreviewItem,IAttachment } from "./BpclEntityHomeServices";

interface Props {
  show: boolean;
  onClose: () => void;
  item?: IEventPreviewItem;
  attachments?: IAttachment[];
}

const SITE_URL = "https://bharatpetroleum.sharepoint.com";

const PreviewEventsModal: React.FC<Props> = ({
  show,
  onClose,
  item,
  attachments = [],
}) => {
  if (!show || !item) return null;

  const getFileUrl = (fileName: string): string => {
    for (let i = 0; i < attachments.length; i++) {
      if (attachments[i].FileName === fileName) {
        return SITE_URL + attachments[i].ServerRelativeUrl;
      }
    }
    return "";
  };

  const images: string[] = [];

  if (item.Thumbnail) {
    const url = getFileUrl(item.Thumbnail);
    if (url) images.push(url);
  }

  if (images.length === 0 && attachments.length > 0) {
    attachments.forEach(att => {
      images.push(SITE_URL + att.ServerRelativeUrl);
    });
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>
          {item.Title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>
        {/* Images */}
        {images.length > 0 && (
          <Carousel controls={false} indicators={false}  pause="hover">
            {images.map((img, i) => (
              <Carousel.Item key={i}>
                <img
                  src={img}
                  alt="Event"
                  className="d-block w-100"
                  style={{
                    height:"auto",
                    objectFit: "contain",
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* Event Date */}
        {item.PublishedDate && (
          <p className="mt-3 mb-2 fw-semibold">
            {new Date(item.PublishedDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {/* ✅ Event Description (THIS WAS MISSING) */}
        {item.MainDescription && (
          <div
            className={styles.previewDesc}
            dangerouslySetInnerHTML={{
              __html: item.MainDescription,
            }}
          />
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

export default PreviewEventsModal;