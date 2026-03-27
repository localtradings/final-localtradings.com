"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ImageSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  images: readonly string[];
  interval?: number;
}

const ImageSlider = React.forwardRef<HTMLDivElement, ImageSliderProps>(
  ({ images, interval = 5000, className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      if (images.length <= 1) {
        return;
      }

      const timer = window.setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1,
        );
      }, interval);

      return () => window.clearInterval(timer);
    }, [images, interval]);

    if (images.length === 0) {
      return (
        <div
          className={cn("relative h-full w-full bg-surface-high", className)}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <div
        className={cn("relative h-full w-full overflow-hidden bg-surface-low", className)}
        ref={ref}
        {...props}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            alt={`Slide ${currentIndex + 1}`}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 h-full w-full object-cover"
            exit={{ opacity: 0, scale: 1.03 }}
            initial={{ opacity: 0, scale: 1.06 }}
            key={images[currentIndex]}
            src={images[currentIndex]}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,19,17,0.08),rgba(20,19,17,0.8)_58%,rgba(20,19,17,0.96))]" />
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                currentIndex === index
                  ? "w-7 bg-primary"
                  : "w-2.5 bg-white/45 hover:bg-white/70",
              )}
              key={index}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    );
  },
);

ImageSlider.displayName = "ImageSlider";

export { ImageSlider };
