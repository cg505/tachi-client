import { APIFetchV1, ToAPIURL } from "util/api";
import { DelayedPageReload, FetchJSONBody, UppercaseFirst } from "util/misc";
import useSetSubheader from "components/layout/header/useSetSubheader";
import Card from "components/layout/page/Card";
import ProfilePicture from "components/user/ProfilePicture";
import Divider from "components/util/Divider";
import Icon from "components/util/Icon";
import Muted from "components/util/Muted";
import SelectButton from "components/util/SelectButton";
import { UserSettingsContext } from "context/UserSettingsContext";
import { useFormik } from "formik";
import { TachiConfig } from "lib/config";
import React, { useContext, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { PublicUserDocument, UserSettings } from "tachi-common";

interface Props {
	reqUser: PublicUserDocument;
}

export default function UserSettingsPage({ reqUser }: Props) {
	useSetSubheader(
		["Users", reqUser.username, "Settings"],
		[reqUser],
		`${reqUser.username}'s Settings`
	);

	const [page, setPage] = useState<"image" | "socialMedia" | "preferences" | "account">("image");

	return (
		<Card header="Settings" className="col-12 offset-lg-2 col-lg-8">
			<div className="row">
				<div className="col-12">
					<div className="btn-group d-flex justify-content-center">
						<SelectButton value={page} setValue={setPage} id="image">
							<Icon type="image" />
							Pictures
						</SelectButton>
						<SelectButton value={page} setValue={setPage} id="socialMedia">
							<Icon type="twitter" brand />
							Social Media
						</SelectButton>
						<SelectButton value={page} setValue={setPage} id="preferences">
							<Icon type="cogs" />
							UI Preferences
						</SelectButton>
						<SelectButton value={page} setValue={setPage} id="account">
							<Icon type="lock" />
							Change Password
						</SelectButton>
					</div>
				</div>
				<div className="col-12">
					<Divider className="mt-4 mb-4" />
					{page === "image" ? (
						<ImageForm reqUser={reqUser} />
					) : page === "socialMedia" ? (
						<SocialMediaForm reqUser={reqUser} />
					) : page === "account" ? (
						<AccountSettings reqUser={reqUser} />
					) : (
						<PreferencesForm reqUser={reqUser} />
					)}
				</div>
				<div className="col-12">
					<Divider />
					<Muted>
						Looking to change settings for a specific game? Go to your game profile, and
						select those settings!
					</Muted>
				</div>
			</div>
		</Card>
	);
}

function AccountSettings({ reqUser }: { reqUser: PublicUserDocument }) {
	const formik = useFormik({
		initialValues: {
			"!oldPassword": "",
			"!password": "",
			confPass: "",
		},
		onSubmit: async values => {
			const r = await APIFetchV1<UserSettings>(
				`/users/${reqUser.id}/change-password`,
				{
					method: "POST",
					...FetchJSONBody({
						"!oldPassword": values["!oldPassword"],
						"!password": values["!password"],
					}),
				},
				true,
				true
			);

			if (r.success) {
				formik.setValues({
					"!oldPassword": "",
					"!password": "",
					confPass: "",
				});
			}
		},
	});

	return (
		<Form onSubmit={formik.handleSubmit}>
			<Form.Group>
				<Form.Label>Old Password</Form.Label>
				<Form.Control
					type="password"
					id="!oldPassword"
					value={formik.values["!oldPassword"]}
					placeholder="Your Current Password"
					onChange={formik.handleChange}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>New Password</Form.Label>
				<Form.Control
					type="password"
					id="!password"
					value={formik.values["!password"]}
					placeholder="New Password"
					onChange={formik.handleChange}
				/>
				{formik.values["!password"].length < 8 && (
					<Form.Text className="text-warning">
						Passwords have to be atleast 8 characters long.
					</Form.Text>
				)}
			</Form.Group>
			<Form.Group>
				<Form.Label>Confirm New Password</Form.Label>
				<Form.Control
					type="password"
					id="confPass"
					value={formik.values.confPass}
					placeholder="New Password"
					onChange={formik.handleChange}
				/>
			</Form.Group>
			{!(formik.values["!password"] === formik.values.confPass) && (
				<Form.Text className="text-danger">Passwords don't match!</Form.Text>
			)}
			<Button
				className="mt-8"
				variant="danger"
				type="submit"
				disabled={
					!(
						formik.values["!password"] === formik.values.confPass &&
						formik.values.confPass.length >= 8
					)
				}
			>
				Change Password
			</Button>
		</Form>
	);
}

function PreferencesForm({ reqUser }: { reqUser: PublicUserDocument }) {
	const { settings, setSettings } = useContext(UserSettingsContext);

	const formik = useFormik({
		initialValues: {
			developerMode: settings?.preferences.developerMode ?? false,
			invisible: settings?.preferences.invisible ?? false,
			contentiousContent: settings?.preferences.contentiousContent ?? false,
			advancedMode: settings?.preferences.advancedMode ?? false,
			deletableScores: settings?.preferences.deletableScores ?? false,
		},
		onSubmit: async values => {
			const res = await APIFetchV1<UserSettings>(
				`/users/${reqUser.id}/settings`,
				{
					method: "PATCH",
					...FetchJSONBody(values),
				},
				true,
				true
			);

			if (res.success) {
				setSettings(res.body);
			}
		},
	});

	return (
		<Form onSubmit={formik.handleSubmit}>
			<Form.Group>
				<Form.Check
					type="checkbox"
					id="developerMode"
					checked={formik.values.developerMode}
					onChange={formik.handleChange}
					label="Developer Mode"
				/>
				<Form.Text>Enable debug information and other useful debugging buttons.</Form.Text>
			</Form.Group>
			<Form.Group>
				<Form.Check
					type="checkbox"
					id="advancedMode"
					checked={formik.values.advancedMode}
					onChange={formik.handleChange}
					label="Advanced Mode"
				/>
				<Form.Text>
					Enable advanced stuff, like being able to copy a tables contents into a CSV.
				</Form.Text>
			</Form.Group>
			{/* <Form.Group>
				<Form.Check
					type="checkbox"
					id="invisible"
					checked={formik.values.invisible}
					onChange={formik.handleChange}
					label="Invisible Mode"
				/>
				<Form.Text>Hide your last seen status.</Form.Text>
			</Form.Group> */}
			<Form.Group>
				<Form.Check
					type="checkbox"
					id="deletableScores"
					checked={formik.values.deletableScores}
					onChange={formik.handleChange}
					label="Deletable Scores"
				/>
				<Form.Text>
					Enables the option to delete scores. Turn this off if the thought of deleting a
					score gives you anxiety.
				</Form.Text>
			</Form.Group>
			<Form.Group>
				<Form.Check
					type="checkbox"
					id="contentiousContent"
					checked={formik.values.contentiousContent}
					onChange={formik.handleChange}
					label="Family Unfriendly Mode"
				/>
				<Form.Text>
					Show slightly less appropriate splash texts in certain places.
				</Form.Text>
			</Form.Group>
			<Button type="submit">Update Settings</Button>
		</Form>
	);
}

function ImageForm({ reqUser }: { reqUser: PublicUserDocument }) {
	const [pfp, setPfp] = useState<File | undefined>();
	const [banner, setBanner] = useState<File | undefined>();

	return (
		<div>
			<Alert variant="danger">
				Remember Rule 6! Do not set inappropriate stuff as your avatar/banner. If you have
				to ask, the answer is probably no.
			</Alert>
			<Form.Group>
				<Form.Label>Profile Picture</Form.Label>
				<input
					className="form-control"
					accept="image/png,image/jpeg,image/gif"
					tabIndex={1}
					type="file"
					id="pfp"
					multiple={false}
					onChange={e => setPfp(e.target.files![0])}
				/>
				<div className="d-flex justify-content-center mt-4">
					<ProfilePicture
						user={reqUser}
						src={pfp ? URL.createObjectURL(pfp) : ToAPIURL(`/users/${reqUser.id}/pfp`)}
					/>
				</div>
				<FileUploadController file={pfp} reqUser={reqUser} type="pfp" />
			</Form.Group>
			<Form.Group>
				<Form.Label>Profile Banner</Form.Label>
				<input
					className="form-control"
					accept="image/png,image/jpeg,image/gif"
					tabIndex={2}
					type="file"
					id="banner"
					multiple={false}
					onChange={e => setBanner(e.target.files![0])}
				/>
				<div
					className="d-flex justify-content-center mt-4 rounded"
					style={{
						height: "200px",
						boxShadow: "0px 0px 10px 0px #000000",
						backgroundRepeat: "no-repeat",
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundImage: `url(${
							banner
								? URL.createObjectURL(banner)
								: ToAPIURL(`/users/${reqUser.id}/banner`)
						})`,
					}}
				/>
				<FileUploadController file={banner} reqUser={reqUser} type="banner" />
			</Form.Group>
		</div>
	);
}

function SocialMediaForm({ reqUser }: { reqUser: PublicUserDocument }) {
	const placeholders = {
		discord: "Example#0000",
		twitter: "Twitter Handle",
		twitch: "Twitch Username",
		github: "Github Username",
		youtube: "Channel Name",
		steam: "Steam Community ID",
	};

	const formik = useFormik({
		initialValues: {
			discord: reqUser.socialMedia.discord ?? "",
			twitter: reqUser.socialMedia.twitter ?? "",
			twitch: reqUser.socialMedia.twitch ?? "",
			github: reqUser.socialMedia.github ?? "",
			steam: reqUser.socialMedia.steam ?? "",
			youtube: reqUser.socialMedia.youtube ?? "",
		},
		onSubmit: async values => {
			const valuesClone: Record<string, string | null> = {};
			for (const v in values) {
				const vx = v as keyof typeof values;
				valuesClone[vx] = values[vx] || null;
			}

			const rj = await APIFetchV1<PublicUserDocument>(
				"/users/me",
				{
					method: "PATCH",
					body: JSON.stringify(valuesClone),
					headers: {
						"Content-Type": "application/json",
					},
				},
				true,
				true
			);

			if (rj.success) {
				DelayedPageReload();
			}
		},
	});

	return (
		<Form onSubmit={formik.handleSubmit}>
			{(["discord", "twitter", "github", "steam", "youtube"] as const).map((e, i) => (
				<Form.Group key={e}>
					<Form.Label>{UppercaseFirst(e)}</Form.Label>
					<Form.Control
						tabIndex={i + 1}
						type="text"
						id={e}
						value={formik.values[e]}
						placeholder={placeholders[e]}
						onChange={formik.handleChange}
					/>
				</Form.Group>
			))}
			<Form.Group>
				<Form.Label>Twitch</Form.Label>
				<Form.Control
					tabIndex={6}
					type="text"
					id="twitch"
					value={formik.values.twitch}
					placeholder={placeholders.twitch}
					onChange={formik.handleChange}
				/>
				<Form.Text className="text-muted">
					If you are streaming a game supported by {TachiConfig.name}, your stream may
					appear on that games page!
				</Form.Text>
			</Form.Group>
			<div className="row justify-content-center">
				<Button type="submit" variant="success">
					Submit
				</Button>
			</div>
		</Form>
	);
}

function SizeWarner({ bytes, cap }: { bytes: number; cap: number }) {
	const kb = bytes / 1_000;

	let className = "text-success";

	if (kb > cap) {
		className = "text-danger";
	} else if (cap * 0.95 < kb) {
		className = "text-warning";
	}

	return (
		<span className={className}>
			{kb}kb/{cap}kb
		</span>
	);
}

function FileUploadController({
	file,
	type,
	reqUser,
}: {
	file?: File;
	type: "pfp" | "banner";
	reqUser: PublicUserDocument;
}) {
	return (
		<div className="d-flex mt-8">
			<Button
				onClick={async () => {
					const res = await APIFetchV1(
						`/users/me/${type}`,
						{ method: "DELETE" },
						true,
						true
					);

					if (res.success) {
						DelayedPageReload();
					}
				}}
				disabled={!reqUser.customPfpLocation}
				className="mr-auto"
				variant="secondary"
			>
				Unset
			</Button>
			{file && (
				<div className="mx-auto">
					<SizeWarner bytes={file.size} cap={1024} />
				</div>
			)}
			{file && (
				<Button
					onClick={async () => {
						const formData = new FormData();
						formData.append(type, file);

						const res = await APIFetchV1(
							`/users/me/${type}`,
							{
								method: "PUT",
								body: formData,
							},
							true,
							true
						);

						if (res.success) {
							window.location.reload();
						}
					}}
					className="ml-auto"
					variant="success"
					disabled={file.size > 1024 * 1000}
				>
					Submit
				</Button>
			)}
		</div>
	);
}
