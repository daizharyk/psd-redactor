import GoBack from "@/button/goBack";
import styles from "./page.module.css";

const page = () => {
  return (
    <div>
      <GoBack />
      <div className={styles.container}>В разработке</div>
    </div>
  );
};

export default page;
