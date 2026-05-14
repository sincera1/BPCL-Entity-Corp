import * as React from "react";
import styles from "../components/Loader.module.scss";
import loaderGif from "../assets/images/loader/loader.gif";
 
interface ILoaderProps {
  show: boolean;
}
 
const Loader: React.FC<ILoaderProps> = ({ show }) => {
  if (!show) return null;
 
  return (
    <div className={styles.overlay}>
      <img
        src={loaderGif}
        alt="Loading..."
        className={styles.loaderGif}
      />
    </div>
  );
};
 
export default Loader;