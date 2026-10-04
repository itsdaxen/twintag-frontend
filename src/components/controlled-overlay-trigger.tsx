import { Button } from "@heroui/react";

export function ControlledOverlayTrigger() {
  // HeroUI's controlled Modal and AlertDialog roots still require a pressable
  // trigger child to satisfy their underlying React Aria DialogTrigger contract.
  return (
    <Button
      aria-hidden="true"
      className="hidden"
      isDisabled
    />
  );
}
