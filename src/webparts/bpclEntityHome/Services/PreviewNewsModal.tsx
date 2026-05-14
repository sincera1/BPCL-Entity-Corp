import * as React from "react";
import {  Carousel, Modal } from "react-bootstrap";
import "@fontsource/inter";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import styles from "../components/BpclEntityHome.module.scss";
import { INewsPreviewItem } from "./BpclEntityHomeServices";

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  item?: INewsPreviewItem;
  attachments?: IAttachment[];
}

const PreviewNewsModal: React.FC<Props> = ({
  show,
  onClose,
  item,
  attachments = [],
}) => {
  if (!show || !item) return null;

  const resolveImageFromAttachments = (fieldValue?: string): string => {
    if (!fieldValue || !attachments.length) return "";

    let fileName = fieldValue;

    try {
      const parsed = JSON.parse(fieldValue);
      fileName = parsed?.fileName || parsed?.FileName || fieldValue;
    } catch {
      // not JSON
    }

    const match = attachments.find(
      (a) => a.FileName?.toLowerCase() === fileName.toLowerCase()
    );

    return match?.ServerRelativeUrl || "";
  };

  // ✅ Build images with captions
  const images: { url: string; caption: string }[] = [
    { value: item.Thumbnail, caption: item.ThumbnailCaption || "" },
    { value: item.Picture1, caption: item.Pic1Caption || "" },
    { value: item.Picture2, caption: item.Pic2Caption || "" },
    { value: item.Picture3, caption: item.Pic3Caption || "" },
  ]
    .filter((img) => img.value)
    .map((img) => ({
      url: resolveImageFromAttachments(img.value),
      caption: img.caption,
    }))
    .filter((img) => img.url);

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
      style={{ zIndex: 9999 }}
    >
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>
          {item.Title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>
        {images.length > 0 && (
          <Carousel 
          className={styles.modalCarousel}
            interval={3000}
            controls
            indicators={false}
            pause="hover"
            nextIcon={
              <span
                aria-hidden="true"
                className="carousel-control-next-icon"
                style={{ filter: "invert(1)" }}
              />
            }
            prevIcon={
              <span
                aria-hidden="true"
                className="carousel-control-prev-icon"
                style={{ filter: "invert(1)" }}
              />
            }
          >
            {images.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  className="d-block w-100"
                  src={img.url}
                  alt={item.Title || "News image"}
                  style={{
                    height: "auto",
                    width: "100%",
                    objectFit: "scale-down",
                    display: "block",
                    margin: "0 auto",
                  }}
                />

                {/* ✅ Caption */}
                {img.caption && (
                  <Carousel.Caption
                    style={{
                      background: "rgba(0, 0, 0, 0.55)",
                      padding: "10px 15px",
                      textAlign: "center",
                      color: "white",
                    }}
                  >
                    <p className="mb-0 mt-0">{img.caption}</p>
                  </Carousel.Caption>
                )}
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        <div className="p-1 mt-3">
          <p className="mb-2">
            {item.PublishedDate
              ? new Date(item.PublishedDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </p>

          <div
            className={`${styles.previewDesc} mt-0 mb-2`}
            dangerouslySetInnerHTML={{
              __html: item.MainDescription || "",
            }}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PreviewNewsModal;