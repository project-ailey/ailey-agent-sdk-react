import {Toaster as Sonner} from "sonner"
import type {ComponentProps} from "react"

type ToasterProps = ComponentProps<typeof Sonner>

const Toaster = ({...props}: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            {...props}
        />
    )
}

export {Toaster}
