export function LunarisCoreInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-10 flex-1 resize-none bg-transparent outline-none ${props.className || ""}`} />;
}
