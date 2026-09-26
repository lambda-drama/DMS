"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2623],
	{
		2573: (e, t, s) => {
			s.r(t), s.d(t, { default: () => g });
			var r = s(95155),
				a = s(12115),
				i = s(44855),
				c = s(32144),
				l = s(55833),
				n = s(4474),
				o = s(79984),
				d = s(39658),
				u = s(39540),
				m = s(42074),
				x = s(10086),
				p = s(44462),
				y = s(93108),
				b = s(6296);
			function g() {
				let { navigate: e } = (0, l.c)(),
					{ data: t } = (0, i.Ay)("crm-activity-form-options", c.Ac),
					[s, g] = (0, a.useState)(!1),
					{ error: f, success: h, showError: v, clear: j } = (0, y.B)(),
					[_, k] = (0, a.useState)({
						subject: "",
						activity_type: "Call",
						status: "Open",
						priority: "Medium",
						due_datetime: "",
						customer: "",
						is_recurring: !1,
						recurrence_frequency: "",
						outcome_notes: "",
					}),
					N = (e, t) => k((s) => ({ ...s, [e]: t })),
					w = (e) => (e || []).filter(Boolean).map((e) => ({ value: e, label: e })),
					C = async () => {
						if ((j(), !_.subject.trim())) return void v("Subject is required.");
						g(!0);
						try {
							let t = await (0, c.E1)({
								subject: _.subject.trim(),
								activity_type: _.activity_type,
								status: _.status,
								priority: _.priority,
								due_datetime: _.due_datetime || null,
								customer: _.customer || null,
								is_recurring: +!!_.is_recurring,
								recurrence_frequency:
									(_.is_recurring && _.recurrence_frequency) || null,
								outcome_notes: _.outcome_notes || null,
							});
							e("crm-activity-detail", { id: String(t.name) });
						} catch (e) {
							v(e, "Failed to create activity");
						} finally {
							g(!1);
						}
					};
				return (0, r.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, r.jsx)(y.y, { error: f, success: h, onDismiss: j }),
						(0, r.jsxs)(o.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, r.jsx)(o.aR, {
									children: (0, r.jsx)(o.ZB, {
										className: "text-base",
										children: "New activity",
									}),
								}),
								(0, r.jsxs)(o.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, r.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Subject *",
												}),
												(0, r.jsx)(d.p, {
													value: _.subject,
													onChange: (e) => N("subject", e.target.value),
												}),
											],
										}),
										(0, r.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Type",
												}),
												(0, r.jsx)(x.Zi, {
													options: w(t?.activity_types),
													value: _.activity_type,
													onValueChange: (e) =>
														N("activity_type", e || "Call"),
												}),
											],
										}),
										(0, r.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Priority",
												}),
												(0, r.jsx)(x.Zi, {
													options: w(t?.priorities),
													value: _.priority,
													onValueChange: (e) =>
														N("priority", e || "Medium"),
												}),
											],
										}),
										(0, r.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Due",
												}),
												(0, r.jsx)(d.p, {
													type: "datetime-local",
													value: _.due_datetime,
													onChange: (e) =>
														N("due_datetime", e.target.value),
												}),
											],
										}),
										(0, r.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer",
												}),
												(0, r.jsx)(p.L, {
													value: _.customer,
													onValueChange: (e) => N("customer", e || ""),
												}),
											],
										}),
										(0, r.jsxs)("label", {
											className:
												"flex items-center gap-2 text-sm sm:col-span-2",
											children: [
												(0, r.jsx)("input", {
													type: "checkbox",
													checked: _.is_recurring,
													onChange: (e) =>
														N("is_recurring", e.target.checked),
												}),
												"Recurring activity",
											],
										}),
										_.is_recurring
											? (0, r.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, r.jsx)("label", {
															className:
																"block text-xs font-medium text-muted-foreground",
															children: "Frequency",
														}),
														(0, r.jsx)(x.Zi, {
															options: w(t?.recurrence_frequencies),
															value: _.recurrence_frequency,
															onValueChange: (e) =>
																N("recurrence_frequency", e || ""),
														}),
													],
											  })
											: null,
										(0, r.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, r.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Notes",
												}),
												(0, r.jsx)(u.T, {
													rows: 2,
													value: _.outcome_notes,
													onChange: (e) =>
														N("outcome_notes", e.target.value),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, r.jsxs)(m.h, {
							children: [
								(0, r.jsx)(n.$, {
									variant: "outline",
									onClick: () => e("crm-activities"),
									children: "Cancel",
								}),
								(0, r.jsxs)(n.$, {
									onClick: () => void C(),
									disabled: s,
									children: [
										s
											? (0, r.jsx)(b.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Create activity",
									],
								}),
							],
						}),
					],
				});
			}
		},
		12651: (e, t, s) => {
			s.d(t, { A: () => r });
			let r = (0, s(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, s) => {
			s.d(t, { A: () => r });
			let r = (0, s(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		39540: (e, t, s) => {
			s.d(t, { T: () => i });
			var r = s(95155);
			s(12115);
			var a = s(91337);
			function i({ className: e, ...t }) {
				return (0, r.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, a.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		42074: (e, t, s) => {
			s.d(t, { h: () => l });
			var r = s(95155),
				a = s(12115),
				i = s(47650),
				c = s(91337);
			function l({ children: e, className: t, align: s = "end" }) {
				let [n, o] = (0, a.useState)(!1);
				(0, a.useEffect)(() => (o(!0), () => o(!1)), []);
				let d = (0, r.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, c.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						t
					),
					children: (0, r.jsx)("div", {
						className: (0, c.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === s
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return n ? (0, i.createPortal)(d, document.body) : null;
			}
		},
	},
]);
