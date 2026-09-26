"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8773],
	{
		12651: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		39540: (e, a, s) => {
			s.d(a, { T: () => r });
			var t = s(95155);
			s(12115);
			var l = s(91337);
			function r({ className: e, ...a }) {
				return (0, t.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, l.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...a,
				});
			}
		},
		42074: (e, a, s) => {
			s.d(a, { h: () => i });
			var t = s(95155),
				l = s(12115),
				r = s(47650),
				n = s(91337);
			function i({ children: e, className: a, align: s = "end" }) {
				let [c, o] = (0, l.useState)(!1);
				(0, l.useEffect)(() => (o(!0), () => o(!1)), []);
				let d = (0, t.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, n.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						a
					),
					children: (0, t.jsx)("div", {
						className: (0, n.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === s
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return c ? (0, r.createPortal)(d, document.body) : null;
			}
		},
		78773: (e, a, s) => {
			s.r(a), s.d(a, { default: () => b });
			var t = s(95155),
				l = s(12115),
				r = s(44855),
				n = s(32144),
				i = s(55833),
				c = s(4474),
				o = s(79984),
				d = s(39658),
				m = s(39540),
				u = s(42074),
				p = s(10086),
				x = s(93108),
				g = s(6296);
			function b() {
				let { navigate: e } = (0, i.c)(),
					{ data: a } = (0, r.Ay)("crm-campaign-form-options", n.TU),
					{ data: s } = (0, r.Ay)("crm-segments-pick", () => (0, n.Bz)({ limit: 100 })),
					{ data: b } = (0, r.Ay)("crm-suppressions-pick", () =>
						(0, n.lM)({ limit: 50 })
					),
					[h, f] = (0, l.useState)(!1),
					{ error: v, success: j, showError: y, clear: _ } = (0, x.B)(),
					[N, k] = (0, l.useState)({
						campaign_name: "",
						campaign_type: "Retail Promotion",
						status: "Draft",
						channel: "Phone",
						start_date: "",
						end_date: "",
						budget: "",
						segment: "",
						suppression_list: "",
						control_group_pct: "0",
						offer: "",
						language_version: "",
						message_template: "",
						notes: "",
					}),
					w = (e, a) => k((s) => ({ ...s, [e]: a })),
					C = (e) => (e || []).filter(Boolean).map((e) => ({ value: e, label: e })),
					S = (0, l.useMemo)(
						() =>
							(s?.data || []).map((e) => ({
								value: String(e.name),
								label: String(e.segment_name || e.name),
							})),
						[s]
					),
					A = (0, l.useMemo)(
						() =>
							(b?.data || []).map((e) => ({
								value: String(e.name),
								label: String(e.list_name || e.name),
							})),
						[b]
					),
					T = async () => {
						if ((_(), !N.campaign_name.trim()))
							return void y("Campaign name is required.");
						f(!0);
						try {
							let a = await (0, n.bi)({
								...N,
								campaign_name: N.campaign_name.trim(),
								budget: N.budget ? Number(N.budget) : null,
								control_group_pct: N.control_group_pct
									? Number(N.control_group_pct)
									: 0,
								start_date: N.start_date || null,
								end_date: N.end_date || null,
								segment: N.segment || null,
								suppression_list: N.suppression_list || null,
							});
							e("crm-campaign-detail", { id: String(a.name) });
						} catch (e) {
							y(e, "Failed to create campaign");
						} finally {
							f(!1);
						}
					};
				return (0, t.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, t.jsx)(x.y, { error: v, success: j, onDismiss: _ }),
						(0, t.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, t.jsx)(o.aR, {
									children: (0, t.jsx)(o.ZB, {
										className: "text-base",
										children: "New campaign",
									}),
								}),
								(0, t.jsxs)(o.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, t.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Name *",
												}),
												(0, t.jsx)(d.p, {
													value: N.campaign_name,
													onChange: (e) =>
														w("campaign_name", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type *",
												}),
												(0, t.jsx)(p.Zi, {
													options: C(a?.campaign_types),
													value: N.campaign_type,
													onValueChange: (e) =>
														w("campaign_type", e || ""),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Channel",
												}),
												(0, t.jsx)(p.Zi, {
													options: C(a?.channels),
													value: N.channel,
													onValueChange: (e) => w("channel", e || ""),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Start",
												}),
												(0, t.jsx)(d.p, {
													type: "date",
													value: N.start_date,
													onChange: (e) =>
														w("start_date", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "End",
												}),
												(0, t.jsx)(d.p, {
													type: "date",
													value: N.end_date,
													onChange: (e) => w("end_date", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Budget",
												}),
												(0, t.jsx)(d.p, {
													type: "number",
													value: N.budget,
													onChange: (e) => w("budget", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Control group %",
												}),
												(0, t.jsx)(d.p, {
													type: "number",
													value: N.control_group_pct,
													onChange: (e) =>
														w("control_group_pct", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Target segment",
												}),
												(0, t.jsx)(p.Zi, {
													options: S,
													value: N.segment,
													onValueChange: (e) => w("segment", e || ""),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Suppression list",
												}),
												(0, t.jsx)(p.Zi, {
													options: A,
													value: N.suppression_list,
													onValueChange: (e) =>
														w("suppression_list", e || ""),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Offer",
												}),
												(0, t.jsx)(m.T, {
													rows: 2,
													value: N.offer,
													onChange: (e) => w("offer", e.target.value),
												}),
											],
										}),
										(0, t.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, t.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Message template",
												}),
												(0, t.jsx)(m.T, {
													rows: 4,
													value: N.message_template,
													onChange: (e) =>
														w("message_template", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, t.jsxs)(u.h, {
							children: [
								(0, t.jsx)(c.$, {
									variant: "outline",
									onClick: () => e("crm-campaigns"),
									children: "Cancel",
								}),
								(0, t.jsxs)(c.$, {
									onClick: () => void T(),
									disabled: h,
									children: [
										h
											? (0, t.jsx)(g.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Create campaign",
									],
								}),
							],
						}),
					],
				});
			}
		},
		93108: (e, a, s) => {
			s.d(a, { B: () => d, y: () => m });
			var t = s(95155),
				l = s(12115),
				r = s(66609),
				n = s(13545),
				i = s(12651),
				c = s(33210),
				o = s(91337);
			function d() {
				let [e, a] = (0, l.useState)(""),
					[s, t] = (0, l.useState)(""),
					n = (0, l.useCallback)((e, s = "Something went wrong.") => {
						let l =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || s;
						return (
							t(""),
							a(l),
							r.o.error(l, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							l
						);
					}, []);
				return {
					error: e,
					success: s,
					showError: n,
					showSuccess: (0, l.useCallback)((e) => {
						a(""), t(e), r.o.success(e);
					}, []),
					clear: (0, l.useCallback)(() => {
						a(""), t("");
					}, []),
				};
			}
			function m({ error: e, success: a, onDismiss: s, className: l }) {
				if (!e && !a) return null;
				let r = !!e;
				return (0, t.jsx)("div", {
					className: (0, o.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", l),
					children: (0, t.jsxs)("div", {
						role: r ? "alert" : "status",
						"aria-live": r ? "assertive" : "polite",
						className: (0, o.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							r
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							r
								? (0, t.jsx)(n.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, t.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, t.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || a,
							}),
							s
								? (0, t.jsx)("button", {
										type: "button",
										onClick: s,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, t.jsx)(c.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
