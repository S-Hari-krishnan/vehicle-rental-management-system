import { useEffect, useState } from "react";

const VEHICLE_PLACEHOLDER = "/assets/vehicle-placeholder.svg";

export default function VehicleImage({
  src,
  alt = "vehicle",
  className,
  style,
  fallback = VEHICLE_PLACEHOLDER,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <img
      src={!src || failed ? fallback : src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
