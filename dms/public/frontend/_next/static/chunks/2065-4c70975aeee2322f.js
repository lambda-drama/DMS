"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2065],
	{
		2065: (e, t, s) => {
			s.r(t), s.d(t, { default: () => v });
			var a = s(95155),
				n = s(12115),
				r = s(44855),
				i = s(32144),
				o = s(55833),
				l = s(38291),
				d = s(4474),
				c = s(79984),
				m = s(39658),
				u = s(39540),
				p = s(23511),
				x = s(42074),
				g = s(10086),
				h = s(93108),
				b = s(80723),
				f = s(6296);
			function v() {
				let { navigate: e, viewParams: t } = (0, o.c)(),
					s = t.get("id") || "",
					{ data: v } = (0, r.Ay)("crm-sales-appointment-form-options", i.AW),
					{
						data: y,
						isLoading: j,
						mutate: N,
					} = (0, r.Ay)(s ? ["crm-sales-appointment", s] : null, () => (0, i.GX)(s)),
					[_, k] = (0, n.useState)(!1),
					{ error: w, success: S, showError: A, showSuccess: C, clear: E } = (0, h.B)(),
					[z, Z] = (0, n.useState)({
						appointment_datetime: "",
						duration_minutes: "60",
						appointment_type: "",
						status: "",
						assigned_to: "",
						agenda: "",
						outcome_notes: "",
					});
				(0, n.useEffect)(() => {
					y &&
						Z({
							appointment_datetime: String(y.appointment_datetime || "").slice(
								0,
								16
							),
							duration_minutes: String(y.duration_minutes || 60),
							appointment_type: String(y.appointment_type || ""),
							status: String(y.status || ""),
							assigned_to: String(y.assigned_to || ""),
							agenda: String(y.agenda || ""),
							outcome_notes: String(y.outcome_notes || ""),
						});
				}, [y]);
				let D = (e, t) => Z((s) => ({ ...s, [e]: t })),
					T = async () => {
						if (s) {
							E(), k(!0);
							try {
								await (0, i.qZ)(s, {
									appointment_datetime: z.appointment_datetime,
									duration_minutes: Number(z.duration_minutes || 60),
									appointment_type: z.appointment_type,
									status: z.status,
									assigned_to: z.assigned_to || null,
									agenda: z.agenda || null,
									outcome_notes: z.outcome_notes || null,
								}),
									await N(),
									C("Appointment saved.");
							} catch (e) {
								A(e, "Failed to save");
							} finally {
								k(!1);
							}
						}
					};
				if (!s)
					return (0, a.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No appointment selected.",
					});
				if (j)
					return (0, a.jsxs)("div", {
						className: "space-y-4",
						children: [
							(0, a.jsx)(p.E, { className: "h-10 w-72" }),
							(0, a.jsx)(p.E, { className: "h-64" }),
						],
					});
				if (!y)
					return (0, a.jsx)("p", {
						className: "text-sm text-destructive",
						children: "Appointment not found.",
					});
				let q = (v?.appointment_types || []).map((e) => ({ value: e, label: e })),
					V = (v?.statuses || []).map((e) => ({ value: e, label: e })),
					B = v?.users || [];
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsxs)(d.$, {
							variant: "ghost",
							size: "sm",
							className: "-ml-2 h-8 px-2 text-muted-foreground",
							onClick: () => e("crm-sales-appointments"),
							children: [
								(0, a.jsx)(b.A, { className: "mr-1.5 h-4 w-4" }),
								"Appointments",
							],
						}),
						(0, a.jsxs)("div", {
							children: [
								(0, a.jsx)("h1", {
									className: "text-xl font-semibold tracking-tight",
									children: String(y.customer_name || y.customer || y.name),
								}),
								(0, a.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: String(y.name),
								}),
								(0, a.jsxs)("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: [
										(0, a.jsx)(l.E, {
											variant: "secondary",
											children: String(y.status || "—"),
										}),
										y.appointment_type
											? (0, a.jsx)(l.E, {
													variant: "outline",
													children: String(y.appointment_type),
											  })
											: null,
									],
								}),
							],
						}),
						(0, a.jsx)(h.y, { error: w, success: S, onDismiss: E }),
						(0, a.jsxs)(c.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(c.aR, {
									children: (0, a.jsx)(c.ZB, {
										className: "text-base",
										children: "Appointment",
									}),
								}),
								(0, a.jsxs)(c.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Date & time",
												}),
												(0, a.jsx)(m.p, {
													type: "datetime-local",
													value: z.appointment_datetime,
													onChange: (e) =>
														D("appointment_datetime", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Duration (min)",
												}),
												(0, a.jsx)(m.p, {
													type: "number",
													min: 15,
													value: z.duration_minutes,
													onChange: (e) =>
														D("duration_minutes", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type",
												}),
												(0, a.jsx)(g.Zi, {
													options: q,
													value: z.appointment_type,
													onValueChange: (e) => D("appointment_type", e),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Status",
												}),
												(0, a.jsx)(g.Zi, {
													options: V,
													value: z.status,
													onValueChange: (e) => D("status", e),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Assigned to",
												}),
												(0, a.jsx)(g.Zi, {
													options: B,
													value: z.assigned_to,
													onValueChange: (e) => D("assigned_to", e),
												}),
											],
										}),
										y.opportunity
											? (0, a.jsxs)("button", {
													type: "button",
													className:
														"sm:col-span-2 text-left text-sm text-primary underline-offset-2 hover:underline",
													onClick: () =>
														e("crm-opportunity-detail", {
															id: String(y.opportunity),
														}),
													children: [
														"Open deal ",
														String(
															y.opportunity_title || y.opportunity
														),
													],
											  })
											: null,
										(0, a.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Agenda",
												}),
												(0, a.jsx)(u.T, {
													rows: 3,
													value: z.agenda,
													onChange: (e) => D("agenda", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children:
														"Outcome / notes (required for No-Show or Cancelled)",
												}),
												(0, a.jsx)(u.T, {
													rows: 3,
													value: z.outcome_notes,
													onChange: (e) =>
														D("outcome_notes", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(x.h, {
							children: (0, a.jsxs)(d.$, {
								onClick: T,
								disabled: _,
								children: [
									_
										? (0, a.jsx)(f.A, {
												className: "mr-2 h-4 w-4 animate-spin",
										  })
										: null,
									"Save",
								],
							}),
						}),
					],
				});
			}
		},
		12651: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		23511: (e, t, s) => {
			s.d(t, { E: () => r });
			var a = s(95155),
				n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, n.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => l });
			var a = s(95155);
			s(12115);
			var n = s(42442),
				r = s(18460),
				i = s(91337);
			let o = (0, r.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function l({ className: e, variant: t, asChild: s = !1, ...r }) {
				let d = s ? n.DX : "span";
				return (0, a.jsx)(d, {
					"data-slot": "badge",
					className: (0, i.cn)(o({ variant: t }), e),
					...r,
				});
			}
		},
		39540: (e, t, s) => {
			s.d(t, { T: () => r });
			var a = s(95155);
			s(12115);
			var n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, n.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		42074: (e, t, s) => {
			s.d(t, { h: () => o });
			var a = s(95155),
				n = s(12115),
				r = s(47650),
				i = s(91337);
			function o({ children: e, className: t, align: s = "end" }) {
				let [l, d] = (0, n.useState)(!1);
				(0, n.useEffect)(() => (d(!0), () => d(!1)), []);
				let c = (0, a.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, i.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						t
					),
					children: (0, a.jsx)("div", {
						className: (0, i.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === s
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return l ? (0, r.createPortal)(c, document.body) : null;
			}
		},
		80723: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		93108: (e, t, s) => {
			s.d(t, { B: () => c, y: () => m });
			var a = s(95155),
				n = s(12115),
				r = s(66609),
				i = s(13545),
				o = s(12651),
				l = s(33210),
				d = s(91337);
			function c() {
				let [e, t] = (0, n.useState)(""),
					[s, a] = (0, n.useState)(""),
					i = (0, n.useCallback)((e, s = "Something went wrong.") => {
						let n =
							(e instanceof Error ? e.message : "string" == typeof e ? e : "")
								.replace(/<br\s*\/?>/gi, "\n")
								.replace(/<[^>]*>/g, "")
								.trim() || s;
						return (
							a(""),
							t(n),
							r.o.error(n, { duration: 8e3 }),
							"u" > typeof document &&
								document
									.querySelector("main")
									?.scrollTo({ top: 0, behavior: "smooth" }),
							n
						);
					}, []);
				return {
					error: e,
					success: s,
					showError: i,
					showSuccess: (0, n.useCallback)((e) => {
						t(""), a(e), r.o.success(e);
					}, []),
					clear: (0, n.useCallback)(() => {
						t(""), a("");
					}, []),
				};
			}
			function m({ error: e, success: t, onDismiss: s, className: n }) {
				if (!e && !t) return null;
				let r = !!e;
				return (0, a.jsx)("div", {
					className: (0, d.cn)("sticky top-0 z-40 -mx-1 px-1 pt-1", n),
					children: (0, a.jsxs)("div", {
						role: r ? "alert" : "status",
						"aria-live": r ? "assertive" : "polite",
						className: (0, d.cn)(
							"flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur",
							r
								? "border-destructive/40 bg-destructive/10 text-destructive"
								: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
						),
						children: [
							r
								? (0, a.jsx)(i.A, { className: "mt-0.5 h-4 w-4 shrink-0" })
								: (0, a.jsx)(o.A, { className: "mt-0.5 h-4 w-4 shrink-0" }),
							(0, a.jsx)("p", {
								className: "flex-1 whitespace-pre-wrap break-words",
								children: e || t,
							}),
							s
								? (0, a.jsx)("button", {
										type: "button",
										onClick: s,
										"aria-label": "Dismiss message",
										className:
											"rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
										children: (0, a.jsx)(l.A, { className: "h-4 w-4" }),
								  })
								: null,
						],
					}),
				});
			}
		},
	},
]);
