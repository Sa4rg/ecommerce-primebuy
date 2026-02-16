export function CheckoutSteps({ activeStep, onChangeStep, disabled = false }) {
  function Step({ step, title }) {
    const isActive = activeStep === step;

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeStep(step)}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
          isActive
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="font-semibold">{step}</span>
        <span>{title}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Step step={1} title="Shipping information" />
      <Step step={2} title="Review order" />
    </div>
  );
}
