/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { Modal, Form, Carousel } from "react-bootstrap";
import { StaffPostingService } from "../Services/StaffPostingService";
import styles from "../components/BpclEntityHome.module.scss";

interface IProps {
  show: boolean;
  onClose: () => void;
  itemId: number;
  title: string;
  date: string;
  service: StaffPostingService;
}

const StaffPostingModal: React.FC<IProps> = ({
  show,
  onClose,
  itemId,
  title,
  date,
  service
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [sbuOptions, setSbuOptions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("");

  /* ===========================
     LOAD DATA
  ============================ */
  useEffect(() => {
    if (!itemId) return;

    const loadData = async (): Promise<void> => {
      const data = await service.loadStaffPostingData(itemId);

      setImages(data.images);
      setSbuOptions(data.sbuOptions);

      // ✅ Default select StartIndex = 1 (or smallest available)
   if (data.sbuOptions?.length > 0) {

          // Check if "Office Note" exists
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const officeNote = data.sbuOptions.find(
            (x: any) =>
              x.SBU?.TeamName?.toLowerCase() === "office note"
          );

          if (officeNote) {
            // ✅ If Office Note exists → set as default
            setSelectedIndex(officeNote.StartIndex?.toString());
          } else {
            // ✅ Otherwise fallback to smallest StartIndex
            const sorted = [...data.sbuOptions].sort(
              (a, b) => Number(a.StartIndex) - Number(b.StartIndex)
            );

            setSelectedIndex(sorted[0].StartIndex?.toString());
          }
       } 
    };

   loadData().catch((error) => {
      console.error("Something went wrong. Please contact administrator.");
    });
  }, [itemId]);

  /* ===========================
     REORDER IMAGES BASED ON SELECTED INDEX
  ============================ */

const orderedImages = useMemo(() => {
  if (!selectedIndex) return images;

  const isMatching = (fileName: string): boolean => {
    const name = (fileName || "").toLowerCase();

    if (!name.startsWith(selectedIndex)) return false;

    const nextChar = name.charAt(selectedIndex.length);

    // Allow:
    // 1.jpg
    // 1.1.jpg
    // 1.11.jpg
    // 1_1.jpg
    // 1-1.jpg
    // BUT NOT:
    // 11.jpg
    // 111.jpg

    return (
      nextChar === "" ||
      nextChar === "." ||
      nextChar === "_" ||
      nextChar === "-"
    );
  };

  const matching = images.filter((file: any) =>
    isMatching(file.Name)
  );

  const others = images.filter((file: any) =>
    !isMatching(file.Name)
  );

  return [...matching, ...others];

}, [images, selectedIndex]);
  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>
        {/* Dropdown */}
        <div className="mb-3">
          <Form.Label>Select SBU</Form.Label>
          <Form.Select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
          >
            {sbuOptions.map((opt) => (
              <option key={opt.Id} value={opt.StartIndex}>
                {opt.SBU?.TeamName}
              </option>
            ))}
          </Form.Select>
        </div>

        {/* Carousel */}
        <div >
          {orderedImages.length === 0 ? (
            <div className="text-muted text-center p-3">
              No images found
            </div>
          ) : (
            //<Carousel interval={2000} controls indicators pause="hover" className={styles.modalCarousel}>
              <Carousel 
          className={styles.modalCarousel}
            interval={2000}
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
              {orderedImages.map((file: any, i: number) => {
                const imgUrl =
                  file.ServerRelativeUrl ||
                  file.ServerRelativePath?.DecodedUrl ||
                  "";

                return (
                  <Carousel.Item key={imgUrl || i}>
                    <img
                      className="d-block w-100"
                      src={`${imgUrl}?t=${Date.now()}`}
                      alt={`Staff Posting ${i + 1}`}
                      style={{
                        //maxHeight: "360px",
                        height:"auto",
                        width: "100%",
                        objectFit: "scale-down",
                        margin: "0 auto",
                        borderRadius: "8px",
                      }}
                    />
                  </Carousel.Item>
                );
              })}
            </Carousel>
          )}
        </div>

      </Modal.Body>

      {/* <Modal.Footer>
        <Button onClick={onClose}>Close</Button>
      </Modal.Footer> */}
    </Modal>
  );
};

export default StaffPostingModal;
