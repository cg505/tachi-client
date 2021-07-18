// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// adapted from https://gist.github.com/lou/571b7c0e7797860d6c555a9fdc0496f9
import { Overlay, Tooltip } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";

export default function StickyPopover({
	delay = 1,
	onMouseEnter = () => 0,
	children,
	component,
	placement,
}) {
	const [showPopover, setShowPopover] = useState(false);
	const childNode = useRef(null);
	let setTimeoutConst = 0;

	useEffect(() => () => {
		if (setTimeoutConst) {
			clearTimeout(setTimeoutConst);
		}
	});

	const handleMouseEnter = () => {
		setTimeoutConst = setTimeout(() => {
			setShowPopover(true);
			onMouseEnter();
		}, delay);
	};

	const handleMouseLeave = () => {
		clearTimeout(setTimeoutConst);
		setShowPopover(false);
	};

	const displayChild = React.Children.map(children, child =>
		React.cloneElement(child, {
			onMouseEnter: handleMouseEnter,
			onMouseLeave: handleMouseLeave,
			ref: node => {
				childNode.current = node;
				const { ref } = child;
				if (typeof ref === "function") {
					ref(node);
				}
			},
		})
	)[0];

	return (
		<>
			{displayChild}
			<Overlay
				show={showPopover}
				placement={placement}
				target={childNode}
				shouldUpdatePosition
			>
				<Tooltip
					onMouseEnter={() => {
						setShowPopover(true);
					}}
					onMouseLeave={handleMouseLeave}
					className="fade show tooltip"
					style={{
						boxShadow: "0px 0px 5px black",
						border: "solid black 1px",
					}}
					id={nanoid()}
				>
					{component}
				</Tooltip>
			</Overlay>
		</>
	);
}
