import { useEffect, useState } from "react";
import { motion } from "motion/react";

const CartPopup = ({ product }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (product) {
      setIsVisible(true); // Show the popup again when a new product is added
    }

    const timer = setTimeout(() => {
      setIsVisible(false); // Automatically close the popup after 3 seconds
      // setJustAdded(false);
    }, 3000); // Set the timeout to 3 seconds

    return () => clearTimeout(timer); // Cleanup timer on unmount or if product changes
  }, [product]); // Dependency on product ensures the popup shows up when the product changes

  if (!isVisible || !product) return null;

  return (
    <motion.div
      initial={{ y: -600, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -600, opacity: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="absolute left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm rounded-lg flex items-center justify-center"
    >
      {/* <button className="btn btn-dark rounded-0">✅ Added to cart!</button> */}
      <button className="btn btn-dark rounded-0">✅ Added to cart!</button>
    </motion.div>
  );
};

export default CartPopup;
