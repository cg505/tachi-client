import { Tabs } from "@material-ui/core";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Tab from "@material-ui/core/Tab";

export default function Navbar({ children }: { children: JSX.Element[] }) {
	const links = children.map(e =>
		e.props.to[e.props.to.length - 1] === "/"
			? e.props.to.substring(0, e.props.to.length - 1)
			: e.props.to
	);

	const location = useLocation();

	const value = useMemo(() => {
		const loc = location.pathname.split(/([#?]|\/$)/u)[0];

		return links.indexOf(loc);
	}, [location]);

	return (
		<>
			{/* Comical hack - MUI only injects the right css if it detects this element. */}
			<div className="d-none">
				<Tab />
			</div>
			<ul
				className="nav flex-nowrap d-flex w-100"
				style={{
					justifyContent: "space-evenly",
				}}
			>
				<Tabs variant="scrollable" scrollButtons="auto" value={value}>
					{children}
				</Tabs>
			</ul>
		</>
	);
}