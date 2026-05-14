import * as React from "react";
import { Modal, Row, Col } from "react-bootstrap";
import styles from "../components/BpclEntityHome.module.scss";
import { ITeamMember } from "../Services/UserProfileService";

export interface ITeamProfileModalProps {
  show: boolean;
  onClose: () => void;
  user?: ITeamMember;
  department?: string;
}

const TeamProfileModal: React.FC<ITeamProfileModalProps> = ({
  show,
  onClose,
  user,
  department
}) => {
  if (!user) return null;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Body style={{ position: "relative" }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 20,
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
          <Col md={12}>
            <div className={styles.profileCard}>

              {/* Top Section */}
              <div className="d-flex align-items-center">
                <div className={styles.avatar}>
                  {user.PictureUrl ? (
                    <img
                      src={user.PictureUrl}
                      alt={user.DisplayName}
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    user.DisplayName?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="ms-3">
                  <div className={styles.name}>{user.DisplayName}</div>
                  <div className={styles.designation}>
                    {user.JobTitle || "—"}
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* Info Grid (3 rows × 2 columns) */}
              <div className={styles.infoGrid}>

                {/* Row 1 */}
                <div className={styles.infoItem}>
                  <div className={styles.label}>Email</div>
                  <a
                    href={`mailto:${user.Email}`}
                    className={styles.value}
                  >
                    {user.Email}
                  </a>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.label}>Mobile</div>
                  <a
                    href={`tel:${user.Mobile}`}
                    className={styles.value}
                  >
                    {user.Mobile || "—"}
                  </a>
                </div>

                {/* Row 2 */}
                <div className={styles.infoItem}>
                  <div className={styles.label}>Job Title</div>
                  <div className={styles.value}>
                    {user.JobTitle || "—"}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.label}>Department</div>
                  <div className={styles.value}>
                    {user.Department || department || "—"}
                  </div>
                </div>

                {/* Row 3 */}
                <div className={styles.infoItem}>
                  <div className={styles.label}>Office Location</div>
                  <div className={styles.value}>
                    {user.OfficeLocation || "—"}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.label}>Manager</div>
                  <div className={styles.value}>
                    {user.Manager || "—"}
                  </div>
                </div>

              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default TeamProfileModal;