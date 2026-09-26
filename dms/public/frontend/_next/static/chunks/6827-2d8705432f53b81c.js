"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6827],
	{
		12651: (e, s, t) => {
			t.d(s, { A: () => a });
			let a = (0, t(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, s, t) => {
			t.d(s, { A: () => a });
			let a = (0, t(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		39540: (e, s, t) => {
			t.d(s, { T: () => n });
			var a = t(95155);
			t(12115);
			var l = t(91337);
			function n({ className: e, ...s }) {
				return (0, a.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, l.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...s,
				});
			}
		},
		42074: (e, s, t) => {
			t.d(s, { h: () => i });
			var a = t(95155),
				l = t(12115),
				n = t(47650),
				r = t(91337);
			function i({ children: e, className: s, align: t = "end" }) {
				let [c, d] = (0, l.useState)(!1);
				(0, l.useEffect)(() => (d(!0), () => d(!1)), []);
				let o = (0, a.jsx)("div", {
					role: "toolbar",
					"aria-label": "Form actions",
					className: (0, r.cn)(
						"fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
						"pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
						"lg:left-64",
						s
					),
					children: (0, a.jsx)("div", {
						className: (0, r.cn)(
							"mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6",
							"between" === t
								? "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
								: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
						),
						children: e,
					}),
				});
				return c ? (0, n.createPortal)(o, document.body) : null;
			}
		},
		96873: (e, s, t) => {
			t.r(s), t.d(s, { default: () => f });
			var a = t(95155),
				l = t(12115),
				n = t(44855),
				r = t(32144),
				i = t(55833),
				c = t(4474),
				d = t(79984),
				o = t(39658),
				m = t(39540),
				u = t(42074),
				x = t(10086),
				g = t(44462),
				h = t(93108),
				b = t(6296);
			function f() {
				let { navigate: e, viewParams: s } = (0, i.c)(),
					t = s.get("account") || "",
					{ data: f } = (0, n.Ay)("crm-tender-form-options", r.fQ),
					[p, v] = (0, l.useState)(""),
					{ data: _ } = (0, n.Ay)(["crm-accounts-pick", p], () =>
						(0, r.B)({ search: p || void 0, limit: 30 })
					),
					[y, j] = (0, l.useState)(!1),
					{ error: N, success: k, showError: C, clear: w } = (0, h.B)(),
					[q, S] = (0, l.useState)({
						title: "",
						account: t,
						customer: "",
						issuing_body: "",
						tender_category: "Corporate",
						status: "Draft",
						bid_deadline: "",
						estimated_value: "",
						financing_method: "",
						technical_requirements: "",
						commercial_requirements: "",
						delivery_schedule_notes: "",
						aftersales_commitments: "",
						notes: "",
					}),
					A = (e, s) => S((t) => ({ ...t, [e]: s })),
					T = (0, l.useMemo)(
						() => (f?.categories || []).map((e) => ({ value: e, label: e })),
						[f]
					),
					Z = (0, l.useMemo)(
						() => (f?.statuses || []).map((e) => ({ value: e, label: e })),
						[f]
					),
					V = (0, l.useMemo)(
						() => (f?.financing_methods || []).map((e) => ({ value: e, label: e })),
						[f]
					),
					B = (0, l.useMemo)(
						() =>
							(_?.data || []).map((e) => ({
								value: String(e.name),
								label: String(e.account_name || e.name),
								description: String(e.customer_name || e.customer || ""),
							})),
						[_]
					),
					D = async () => {
						if ((w(), !q.title.trim())) return void C("Title is required.");
						if (!q.customer && !q.account)
							return void C("Customer or Account is required.");
						j(!0);
						try {
							let s = await (0, r.xb)({
									title: q.title.trim(),
									account: q.account || null,
									customer: q.customer || null,
									issuing_body: q.issuing_body || null,
									tender_category: q.tender_category,
									status: q.status,
									bid_deadline: q.bid_deadline || null,
									estimated_value: q.estimated_value
										? Number(q.estimated_value)
										: null,
									financing_method: q.financing_method || null,
									technical_requirements: q.technical_requirements || null,
									commercial_requirements: q.commercial_requirements || null,
									delivery_schedule_notes: q.delivery_schedule_notes || null,
									aftersales_commitments: q.aftersales_commitments || null,
									notes: q.notes || null,
								}),
								t = s?.name;
							t ? e("crm-tender-detail", { id: String(t) }) : e("crm-tenders");
						} catch (e) {
							C(e, "Failed to create tender");
						} finally {
							j(!1);
						}
					};
				return (0, a.jsxs)("div", {
					className: "dms-form-page space-y-4",
					children: [
						(0, a.jsx)(h.y, { error: N, success: k, onDismiss: w }),
						(0, a.jsxs)(d.Zp, {
							className: "border-border/70 shadow-sm",
							children: [
								(0, a.jsx)(d.aR, {
									children: (0, a.jsx)(d.ZB, {
										className: "text-base",
										children: "Fleet / government tender",
									}),
								}),
								(0, a.jsxs)(d.Wu, {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Title *",
												}),
												(0, a.jsx)(o.p, {
													value: q.title,
													onChange: (e) => A("title", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Account",
												}),
												(0, a.jsx)(x.Zi, {
													options: B,
													value: q.account,
													onValueChange: (e) => {
														let s = (_?.data || []).find(
															(s) => String(s.name) === e
														);
														S((t) => ({
															...t,
															account: e || "",
															customer:
																t.customer ||
																String(s?.customer || ""),
														}));
													},
													onSearchChange: v,
													placeholder: "Link account…",
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Customer",
												}),
												(0, a.jsx)(g.L, {
													value: q.customer,
													onValueChange: (e) => A("customer", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Category",
												}),
												(0, a.jsx)(x.Zi, {
													options: T,
													value: q.tender_category,
													onValueChange: (e) =>
														A("tender_category", e || "Corporate"),
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
												(0, a.jsx)(x.Zi, {
													options: Z,
													value: q.status,
													onValueChange: (e) =>
														A("status", e || "Draft"),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Issuing body",
												}),
												(0, a.jsx)(o.p, {
													value: q.issuing_body,
													onChange: (e) =>
														A("issuing_body", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Bid deadline",
												}),
												(0, a.jsx)(o.p, {
													type: "datetime-local",
													value: q.bid_deadline,
													onChange: (e) =>
														A("bid_deadline", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Estimated value",
												}),
												(0, a.jsx)(o.p, {
													type: "number",
													value: q.estimated_value,
													onChange: (e) =>
														A("estimated_value", e.target.value),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Financing / LC",
												}),
												(0, a.jsx)(x.Zi, {
													options: V,
													value: q.financing_method,
													onValueChange: (e) =>
														A("financing_method", e || ""),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Technical requirements",
												}),
												(0, a.jsx)(m.T, {
													rows: 3,
													value: q.technical_requirements,
													onChange: (e) =>
														A(
															"technical_requirements",
															e.target.value
														),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Commercial requirements",
												}),
												(0, a.jsx)(m.T, {
													rows: 3,
													value: q.commercial_requirements,
													onChange: (e) =>
														A(
															"commercial_requirements",
															e.target.value
														),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Delivery schedule",
												}),
												(0, a.jsx)(m.T, {
													rows: 2,
													value: q.delivery_schedule_notes,
													onChange: (e) =>
														A(
															"delivery_schedule_notes",
															e.target.value
														),
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "sm:col-span-2 space-y-2",
											children: [
												(0, a.jsx)("label", {
													className:
														"block text-xs font-medium text-muted-foreground",
													children: "Aftersales commitments",
												}),
												(0, a.jsx)(m.T, {
													rows: 2,
													value: q.aftersales_commitments,
													onChange: (e) =>
														A(
															"aftersales_commitments",
															e.target.value
														),
												}),
											],
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)(u.h, {
							children: [
								(0, a.jsx)(c.$, {
									variant: "outline",
									onClick: () => e("crm-tenders"),
									children: "Cancel",
								}),
								(0, a.jsxs)(c.$, {
									onClick: () => void D(),
									disabled: y,
									children: [
										y
											? (0, a.jsx)(b.A, {
													className: "mr-2 h-4 w-4 animate-spin",
											  })
											: null,
										"Create tender",
									],
								}),
							],
						}),
					],
				});
			}
		},
	},
]);
