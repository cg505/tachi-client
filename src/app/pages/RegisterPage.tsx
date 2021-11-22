import useSetSubheader from "components/layout/header/useSetSubheader";
import Divider from "components/util/Divider";
import { UserContext } from "context/UserContext";
import { useFormik } from "formik";
import { TachiConfig } from "lib/config";
import React, { useContext, useState } from "react";
import { Button, Col, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { Link, useHistory } from "react-router-dom";
import { PublicUserDocument } from "tachi-common";
import { UseFormik } from "types/react";
import { APIFetchV1, ToCDNURL } from "util/api";
import { HumaniseError } from "util/humanise-error";

// seconds it takes for a user to actually read the rules.
const RULES_READ_TIME = Number(process.env.REACT_APP_RULES_READ_TIME) || 30;

export default function RegisterPage() {
	useSetSubheader("Register");

	const [err, setErr] = useState("");
	// not opened: user has not clicked the rules link
	// opened: user has clicked the rules link
	// read: atleast 30 seconds have expired.
	const [readRules, setReadRules] = useState<"not-opened" | "opened" | "read" | "acknowledged">(
		"not-opened"
	);
	const [disabled, setDisabled] = useState(true);
	const [btnText, setBtnText] = useState("I've read the rules. (Click the rules.)");

	const { setUser } = useContext(UserContext);
	const history = useHistory();

	const urlParams = new URLSearchParams(location.search);

	const formik = useFormik({
		initialValues: {
			username: "",
			password: "",
			confPassword: "",
			inviteCode: urlParams.get("inviteCode") ?? "",
			email: "",
			captcha: "temp",
		},
		onSubmit: async values => {
			if (values.password !== values.confPassword) {
				setErr("Password and confirm password do not match!");
				return;
			}

			const rj = await APIFetchV1<PublicUserDocument>(
				"/auth/register",
				{
					method: "POST",
					body: JSON.stringify({
						password: values.password,
						inviteCode: values.inviteCode,
						username: values.username,
						email: values.email,
						captcha: values.captcha,
					}),
					headers: {
						"Content-Type": "application/json",
					},
				},
				false,
				true
			);

			if (!rj.success) {
				setErr(HumaniseError(rj.description));
				return;
			}

			toast.success("Created Account, Logged In!");

			setTimeout(() => {
				setUser(rj.body);
				localStorage.setItem("isLoggedIn", "true");

				history.goBack();
			}, 500);
		},
	});

	function ReadRulesWait() {
		if (readRules !== "not-opened") {
			return;
		}

		setReadRules("opened");

		// users have to actually read the rules.
		let wait = RULES_READ_TIME;
		const tickerRef = setInterval(() => {
			wait--;
			setBtnText(`I've read the rules (${wait}s)`);
		}, 1000);

		setTimeout(() => {
			setReadRules("read");
			setBtnText("I've read the rules.");
			setDisabled(false);
			clearInterval(tickerRef);
		}, RULES_READ_TIME * 1000);
	}

	return (
		<div className="container d-flex flex-column flex-root justify-content-center align-items-center">
			<Col lg="6">
				<div className="text-center mb-10 mb-lg-10">
					<img
						src={ToCDNURL("/logos/logo-wordmark.png")}
						alt={TachiConfig.name}
						width="256px"
					/>
				</div>
				<div className="text-center mb-10 mb-lg-20">
					<h3 className="font-size-h1">Register</h3>
					<span className="font-weight-bold text-dark-50">Have an account?</span>
					<Link to="/login" className="font-weight-bold ml-2">
						Sign in!
					</Link>
				</div>

				{readRules === "acknowledged" ? (
					<RegisterForm formik={formik} err={err} />
				) : (
					<div className="text-center">
						<div className="mb-8">
							<h4>
								Hey! Before you make an account, please read the{" "}
								<a
									href="https://tachi.readthedocs.io/en/latest/user/rules/"
									target="_blank"
									rel="noopener noreferrer"
									onAuxClick={ReadRulesWait}
									onClick={() => {
										setTimeout(() => ReadRulesWait(), 300);
									}}
								>
									Rules.
								</a>
							</h4>

							<h6>(This link opens in a new tab.)</h6>
						</div>

						<Divider />

						{readRules === "opened" ? (
							<p className="mt-4">
								Hey, it takes longer than {RULES_READ_TIME} seconds to read the
								rules.
								<br />I know it sucks to wait around, but the few rules we have are
								enforced strictly.
								<br />
								The last thing you'd want is to accidentally get yourself banned!
							</p>
						) : (
							<></>
						)}

						<div className="justify-content-center d-flex mt-4">
							<Link to="/" tabIndex={-1} className="mr-auto btn btn-outline-danger">
								Back
							</Link>
							<Button
								disabled={disabled}
								className="ml-auto"
								onClick={() => setReadRules("acknowledged")}
							>
								{btnText}
							</Button>
						</div>
					</div>
				)}
			</Col>
		</div>
	);
}

function RegisterForm({
	formik,
	err,
}: {
	formik: UseFormik<{
		username: string;
		password: string;
		confPassword: string;
		inviteCode: string;
		email: string;
		captcha: string;
	}>;
	err: string;
}) {
	return (
		<Form onSubmit={formik.handleSubmit}>
			<Form.Group>
				<Form.Label>Username</Form.Label>
				<Form.Control
					tabIndex={1}
					type="text"
					id="username"
					value={formik.values.username}
					onChange={formik.handleChange}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>Email</Form.Label>
				<Form.Control
					tabIndex={2}
					type="email"
					id="email"
					value={formik.values.email}
					onChange={formik.handleChange}
				/>
				<Form.Text className="text-muted">
					This is used for things like password recovery, and authentication checks. If
					this email is fake, and you forget your password,{" "}
					<b>You will be permanently locked out of your account.</b>
					<br />
					We will never use this to send spam!
				</Form.Text>
			</Form.Group>
			<Form.Group>
				<Form.Label>Password</Form.Label>
				<Form.Control
					tabIndex={3}
					type="password"
					id="password"
					value={formik.values.password}
					onChange={formik.handleChange}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>Confirm Password</Form.Label>
				<Form.Control
					tabIndex={4}
					type="password"
					id="confPassword"
					value={formik.values.confPassword}
					onChange={formik.handleChange}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>Invite Code</Form.Label>
				<Form.Control
					tabIndex={5}
					type="text"
					id="inviteCode"
					value={formik.values.inviteCode}
					onChange={formik.handleChange}
				/>
			</Form.Group>

			<Form.Group style={{ display: err ? "" : "none" }} className="text-center text-danger">
				{err}
			</Form.Group>
			<Form.Group className="justify-content-center d-flex pt-4">
				<Link to="/" tabIndex={7} className="mr-auto btn btn-outline-danger">
					Back
				</Link>
				<Button tabIndex={6} type="submit" className="ml-auto">
					Register!
				</Button>
			</Form.Group>
		</Form>
	);
}
