"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[5347],
	{
		33745: (e, t, a) => {
			a.d(t, { l: () => c });
			var s = a(95155),
				r = a(51914),
				n = a(63360),
				l = a(4474),
				i = a(91337);
			function c({ module: e, label: t, className: a, ...d }) {
				let { canCreate: o } = (0, n.Sk)();
				return o(e)
					? (0, s.jsxs)(l.$, {
							"aria-label": t,
							title: t,
							className: (0, i.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								a
							),
							...d,
							children: [
								(0, s.jsx)(r.A, { className: "h-4 w-4 shrink-0" }),
								(0, s.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: t,
								}),
							],
					  })
					: null;
			}
		},
		39540: (e, t, a) => {
			a.d(t, { T: () => n });
			var s = a(95155);
			a(12115);
			var r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("textarea", {
					"data-slot": "textarea",
					className: (0, r.cn)(
						"border-input placeholder:text-muted-foreground focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-2xl border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
						e
					),
					...t,
				});
			}
		},
		44416: (e, t, a) => {
			a.d(t, { i: () => s });
			function s(e) {
				if (!e) return "";
				let t = String(e);
				if ("u" > typeof document) {
					let e = document.createElement("div");
					return (
						(e.innerHTML = t),
						(e.textContent || e.innerText || "")
							.replace(/<[^>]*>/g, " ")
							.replace(/\s+/g, " ")
							.trim()
					);
				}
				return t
					.replace(/<[^>]*>/g, " ")
					.replace(/\s+/g, " ")
					.trim();
			}
		},
		54828: (e, t, a) => {
			function s(e) {
				return e?.default_customer
					? {
							name: e.default_customer,
							customer_name: e.customer_name || e.default_customer,
							mobile_no: e.mobile_no || void 0,
					  }
					: null;
			}
			function r(e, t, a) {
				let s =
					e?.map((e) => ({
						value: e.name,
						label: e.customer_name,
						description: e.mobile_no || void 0,
					})) || [];
				return t && a && !s.some((e) => e.value === t)
					? [{ value: a.name, label: a.customer_name, description: a.mobile_no }, ...s]
					: s;
			}
			function n(e, t, a) {
				if (!e) {
					let e = s(a);
					return e ? { customer: e.name, meta: e } : { customer: "", meta: null };
				}
				let r = t?.find((t) => t.name === e);
				return r
					? {
							customer: r.name,
							meta: {
								name: r.name,
								customer_name: r.customer_name,
								mobile_no: r.mobile_no,
							},
					  }
					: { customer: e, meta: { name: e, customer_name: e } };
			}
			a.d(t, { Gd: () => s, R: () => n, b0: () => r });
		},
		55347: (e, t, a) => {
			a.r(t), a.d(t, { default: () => ed });
			var s = a(95155),
				r = a(12115),
				n = a(66609),
				l = a(55833),
				i = a(33745),
				c = a(36020),
				d = a(63360),
				o = a(20572),
				m = a(53483),
				u = a(31521),
				h = a(71376),
				x = a(98883),
				p = a(6296),
				v = a(90901),
				_ = a(44855),
				g = a(70521),
				j = a(74350),
				f = a(4474),
				y = a(84437),
				b = a(39658),
				N = a(79792),
				w = a(39540),
				S = a(15306),
				k = a(26518),
				C = a(92751),
				T = a(10086),
				A = a(54828),
				O = a(44416),
				J = a(5240),
				$ = a(66348);
			let V = [
					"In Stock",
					"Allocated",
					"Delivered to Customer",
					"In Service",
					"In Transit",
					"Total Loss",
					"Scrapped",
				],
				I = [
					"Inactive",
					"Active",
					"Expired by Time",
					"Expired by Mileage",
					"Void",
					"Pending Verification",
				],
				P = ["Petrol", "Diesel", "Hybrid", "PHEV", "EV", "CNG", "LPG"],
				E = ["Manual (MT)", "Automatic (AT)", "CVT", "DCT", "AMT", "EV Single Speed"],
				D = ["FWD", "RWD", "AWD", "4WD"],
				L = ["km", "miles"],
				M = ["Fabric", "Leather", "Vinyl", "Synthetic Leather", "Alcantara"],
				Z = [
					"CBU (Completely Built Up)",
					"SKD (Semi Knocked Down)",
					"CKD (Completely Knocked Down)",
					"Local Assembly",
					"Used Import",
				];
			function Q(e, t) {
				let a = [...e],
					s = (t || "").trim();
				return s && !a.includes(s) && a.push(s), a;
			}
			let W = {
				company: "",
				linked_item: "",
				model: "",
				plate_number: "",
				engine_number: "",
				engine_code: "",
				current_customer: "",
				vehicle_status: "In Stock",
				current_odometer: "",
				odometer_unit: "km",
				brand: "",
				model_variant: "",
				model_year: "",
				production_date: "",
				fuel_type: "",
				transmission: "",
				drive_type: "",
				interior_material: "",
				exterior_color: "",
				interior_color: "",
				warranty_status: "Inactive",
				warranty_start_date: "",
				warranty_end_date: "",
				warranty_km_limit: "",
				import_type: "",
				registration_date: "",
				registration_country: "",
				insurance_company: "",
				insurance_policy_number: "",
				insurance_expiry_date: "",
				is_fleet_vehicle: !1,
				fleet_company: "",
				fleet_reference: "",
				special_notes: "",
				internal_notes: "",
			};
			function F(e) {
				return null == e ? "" : String(e);
			}
			function z({ open: e, onOpenChange: t, vehicle: a, onUpdated: l }) {
				let { mutate: i } = (0, v.iX)(),
					[d, o] = (0, r.useState)(!1),
					[m, u] = (0, r.useState)("vehicle"),
					[x, q] = (0, r.useState)(null),
					[B, R] = (0, r.useState)(""),
					[H, U] = (0, r.useState)(""),
					[K, G] = (0, r.useState)(""),
					[Y, X] = (0, r.useState)(""),
					[ee, et] = (0, r.useState)(""),
					[ea, es] = (0, r.useState)(""),
					[er, en] = (0, r.useState)(W),
					{ data: el } = (0, c.dQ)(B),
					{ data: ei } = (0, c.dQ)(H),
					{ data: ec, isLoading: ed } = (0, c.cf)(K),
					{ data: eo, isLoading: em } = (0, c.iR)(Y),
					{ data: eu, isLoading: eh } = (0, c.Ge)(ee),
					{ data: ex, isLoading: ep } = (0, c.Ge)(ea),
					{ data: ev } = (0, _.Ay)(e ? "masters-options" : null, $.kZ),
					{ data: e_ } = (0, _.Ay)(e ? "dms-companies" : null, () => J._N()),
					eg = !!(a?.linked_serial || "").trim(),
					ej = !!a?.serial_in_use;
				function ef(e, t) {
					en((a) => ({ ...a, [e]: t }));
				}
				(0, r.useEffect)(() => {
					e &&
						a &&
						(en({
							...W,
							company: F(a.company),
							linked_item: F(a.linked_item),
							model: F(a.model),
							plate_number: F(a.plate_number),
							engine_number: F(a.engine_number),
							engine_code: F(a.engine_code),
							current_customer: F(a.current_customer),
							vehicle_status: F(a.vehicle_status) || "In Stock",
							current_odometer: F(a.current_odometer),
							odometer_unit: F(a.odometer_unit) || "km",
							brand: F(a.brand),
							model_variant: F(a.model_variant),
							model_year: F(a.model_year),
							production_date: F(a.production_date),
							fuel_type: F(a.fuel_type),
							transmission: F(a.transmission),
							drive_type: F(a.drive_type),
							interior_material: F(a.interior_material),
							exterior_color: F(a.exterior_color),
							interior_color: F(a.interior_color),
							warranty_status: F(a.warranty_status) || "Inactive",
							warranty_start_date: F(a.warranty_start_date),
							warranty_end_date: F(a.warranty_end_date),
							warranty_km_limit: F(a.warranty_km_limit),
							import_type: F(a.import_type),
							registration_date: F(a.registration_date),
							registration_country: F(a.registration_country),
							insurance_company: F(a.insurance_company),
							insurance_policy_number: F(a.insurance_policy_number),
							insurance_expiry_date: F(a.insurance_expiry_date),
							is_fleet_vehicle: !!a.is_fleet_vehicle,
							fleet_company: F(a.fleet_company),
							fleet_reference: F(a.fleet_reference),
							special_notes: (0, O.i)(F(a.special_notes)),
							internal_notes: (0, O.i)(F(a.internal_notes)),
						}),
						u("vehicle"),
						R(""),
						U(""),
						G(""),
						X(""),
						et(""),
						es(""));
				}, [e, a]);
				let ey = (0, r.useMemo)(() => {
						let e = [],
							t = (a?.company || "").trim();
						for (let a of (t && e.push(t), e_ || []))
							a.name && !e.includes(a.name) && e.push(a.name);
						return e;
					}, [a?.company, e_]),
					eb = (0, r.useMemo)(
						() =>
							(ec || []).map((e) => ({
								value: e.name,
								label: e.item_name || e.name,
								description: e.item_code,
							})),
						[ec]
					),
					eN = (0, r.useMemo)(
						() =>
							(eo || []).map((e) => ({
								value: e.name,
								label: e.model_code || e.name,
								description:
									[e.model_name, e.variant].filter(Boolean).join(" ") || void 0,
							})),
						[eo]
					),
					ew = (0, r.useMemo)(
						() =>
							(ev?.brands || []).map((e) => ({
								value: e.name,
								label: e.brand || e.name,
							})),
						[ev?.brands]
					),
					eS = (0, r.useMemo)(
						() =>
							(0, A.b0)(el, er.current_customer, {
								name: er.current_customer,
								customer_name: a?.customer_name || er.current_customer,
							}),
						[el, er.current_customer, a?.customer_name]
					),
					ek = (0, r.useMemo)(
						() =>
							(0, A.b0)(ei, er.fleet_company, {
								name: er.fleet_company,
								customer_name: er.fleet_company,
							}),
						[ei, er.fleet_company]
					),
					eC = (e) =>
						(e || []).map((e) => ({ value: e.name, label: e.label || e.name }));
				async function eT(e) {
					if ((e.preventDefault(), !a?.name)) return;
					let t = (function () {
						if ("" === er.current_odometer) return null;
						let e = Number(a?.current_odometer || 0),
							t = Number(er.current_odometer);
						return e > 0 && Number.isFinite(t) && t > 0 && t < e
							? `Odometer rollback detected! Previous: ${e} km, New: ${t} km.`
							: null;
					})();
					t ? q(t) : await eA(!1);
				}
				async function eA(e) {
					if (!a?.name) return;
					let s = {
						company: er.company || null,
						model: er.model || null,
						plate_number: er.plate_number.trim() || null,
						engine_number: er.engine_number.trim() || null,
						engine_code: er.engine_code.trim() || null,
						current_customer: er.current_customer || null,
						vehicle_status: er.vehicle_status || null,
						current_odometer:
							"" !== er.current_odometer ? Number(er.current_odometer) : null,
						odometer_unit: er.odometer_unit || "km",
						brand: er.brand || null,
						model_variant: er.model_variant.trim() || null,
						model_year: "" !== er.model_year ? Number(er.model_year) : null,
						production_date: er.production_date || null,
						fuel_type: er.fuel_type || null,
						transmission: er.transmission || null,
						drive_type: er.drive_type || null,
						interior_material: er.interior_material || null,
						exterior_color: er.exterior_color || null,
						interior_color: er.interior_color || null,
						warranty_status: er.warranty_status || null,
						warranty_start_date: er.warranty_start_date || null,
						warranty_end_date: er.warranty_end_date || null,
						warranty_km_limit:
							"" !== er.warranty_km_limit ? Number(er.warranty_km_limit) : null,
						import_type: er.import_type || null,
						registration_date: er.registration_date || null,
						registration_country: er.registration_country.trim() || null,
						insurance_company: er.insurance_company.trim() || null,
						insurance_policy_number: er.insurance_policy_number.trim() || null,
						insurance_expiry_date: er.insurance_expiry_date || null,
						is_fleet_vehicle: +!!er.is_fleet_vehicle,
						fleet_company: (er.is_fleet_vehicle && er.fleet_company) || null,
						fleet_reference:
							(er.is_fleet_vehicle && er.fleet_reference.trim()) || null,
						special_notes: er.special_notes.trim() || null,
						internal_notes: er.internal_notes.trim() || null,
					};
					(s.linked_item = er.linked_item || null),
						e && (s.confirm_odometer_rollback = 1),
						o(!0);
					try {
						await h.Q3(a.name, s),
							await i(
								(e) =>
									(Array.isArray(e) &&
										("vehicles" === e[0] || "vehicle" === e[0])) ||
									"vehicles" === e,
								void 0,
								{ revalidate: !0 }
							),
							n.o.success("Vehicle updated"),
							l?.(a.name),
							t(!1);
					} catch (a) {
						let t = a instanceof Error ? a.message : "";
						if (!e && /odometer rollback detected/i.test(t)) return void q(t);
						n.o.error(t || "Failed to update vehicle");
					} finally {
						o(!1);
					}
				}
				return (0, s.jsxs)(s.Fragment, {
					children: [
						(0, s.jsx)(j.lG, {
							open: e,
							onOpenChange: t,
							children: (0, s.jsx)(j.Cf, {
								className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
								children: (0, s.jsxs)("form", {
									onSubmit: eT,
									children: [
										(0, s.jsxs)(j.c7, {
											children: [
												(0, s.jsx)(j.L3, { children: "Edit vehicle" }),
												(0, s.jsx)(j.rr, {
													children: a?.vin_number
														? `Update details for VIN ${a.vin_number}`
														: "Update vehicle master details",
												}),
											],
										}),
										a?.vin_number
											? (0, s.jsxs)("div", {
													className: "space-y-1 pt-3",
													children: [
														(0, s.jsx)(N.J, {
															children: "VIN / Chassis Number",
														}),
														(0, s.jsx)(b.p, {
															value: a.vin_number,
															readOnly: !0,
															disabled: !0,
														}),
													],
											  })
											: null,
										(0, s.jsxs)(S.tU, {
											value: m,
											onValueChange: u,
											className: "gap-3 py-3",
											children: [
												(0, s.jsxs)(S.j7, {
													className: "bg-muted/50 w-full justify-start",
													children: [
														(0, s.jsx)(S.Xi, {
															value: "vehicle",
															children: "Vehicle & Customer",
														}),
														(0, s.jsx)(S.Xi, {
															value: "specs",
															children: "Specifications & More",
														}),
													],
												}),
												(0, s.jsxs)(S.av, {
													value: "vehicle",
													className: "space-y-3",
													children: [
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Vehicle Item",
																		}),
																		(0, s.jsx)(T.Zi, {
																			options: eb,
																			value: er.linked_item,
																			onValueChange: (e) =>
																				ef(
																					"linked_item",
																					e
																				),
																			onSearchChange: G,
																			placeholder:
																				"Search vehicle item...",
																			isLoading: ed,
																			disabled: ej,
																			portaled: !0,
																		}),
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children: ej
																				? `Locked — Serial No ${a?.linked_serial} already has transactions.`
																				: eg
																				? `Saving a different item replaces Serial No ${a?.linked_serial} with one for the new item.`
																				: "ERPNext Item this vehicle is registered as.",
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Vehicle Model",
																		}),
																		(0, s.jsx)(T.Zi, {
																			options: eN,
																			value: er.model,
																			onValueChange: (e) =>
																				ef("model", e),
																			onSearchChange: X,
																			placeholder:
																				"Search vehicle models...",
																			isLoading: em,
																			portaled: !0,
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"License plate",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.plate_number,
																			onChange: (e) =>
																				ef(
																					"plate_number",
																					e.target.value.toUpperCase()
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Engine number",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.engine_number,
																			onChange: (e) =>
																				ef(
																					"engine_number",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Engine code",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.engine_code,
																			onChange: (e) =>
																				ef(
																					"engine_code",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children: "Company",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.company,
																			onValueChange: (e) =>
																				ef("company", e),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select company",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children:
																						ey.map(
																							(e) =>
																								(0,
																								s.jsx)(
																									k.eb,
																									{
																										value: e,
																										children:
																											e,
																									},
																									e
																								)
																						),
																				}),
																			],
																		}),
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children:
																				"The vehicle's current company or a company selected in DMS Settings.",
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Customer / Owner",
																		}),
																		(0, s.jsx)(C.Z, {
																			doctype: "Customer",
																			onCreated: (e) =>
																				ef(
																					"current_customer",
																					e
																				),
																			children: (0, s.jsx)(
																				T.Zi,
																				{
																					options: eS,
																					value: er.current_customer,
																					onValueChange:
																						(e) => {
																							ef(
																								"current_customer",
																								(0,
																								A.R)(
																									e,
																									el,
																									void 0
																								)
																									.customer
																							);
																						},
																					onSearchChange:
																						R,
																					placeholder:
																						"Search customers...",
																					portaled: !0,
																				}
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Vehicle status",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.vehicle_status,
																			onValueChange: (e) =>
																				ef(
																					"vehicle_status",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(
																						k.yv,
																						{}
																					),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						V,
																						er.vehicle_status
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Odometer (current mileage)",
																		}),
																		(0, s.jsxs)("div", {
																			className:
																				"flex gap-2",
																			children: [
																				(0, s.jsx)(b.p, {
																					type: "number",
																					min: 0,
																					placeholder:
																						"e.g. 12500",
																					className:
																						"flex-1",
																					value: er.current_odometer,
																					onChange: (
																						e
																					) =>
																						ef(
																							"current_odometer",
																							e
																								.target
																								.value
																						),
																				}),
																				(0, s.jsxs)(k.l6, {
																					value: er.odometer_unit,
																					onValueChange:
																						(e) =>
																							ef(
																								"odometer_unit",
																								e
																							),
																					children: [
																						(0, s.jsx)(
																							k.bq,
																							{
																								className:
																									"w-24",
																								children:
																									(0,
																									s.jsx)(
																										k.yv,
																										{}
																									),
																							}
																						),
																						(0, s.jsx)(
																							k.gC,
																							{
																								children:
																									Q(
																										L,
																										er.odometer_unit
																									).map(
																										(
																											e
																										) =>
																											(0,
																											s.jsx)(
																												k.eb,
																												{
																													value: e,
																													children:
																														e,
																												},
																												e
																											)
																									),
																							}
																						),
																					],
																				}),
																			],
																		}),
																		(0, s.jsx)("p", {
																			className:
																				"text-xs text-muted-foreground",
																			children:
																				"Odometer can only go up — a lower value is rejected.",
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Warranty status",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.warranty_status,
																			onValueChange: (e) =>
																				ef(
																					"warranty_status",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(
																						k.yv,
																						{}
																					),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						I,
																						er.warranty_status
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [
																(0, s.jsx)(y.S, {
																	id: "edit-vehicle-warranty-active",
																	checked:
																		"Active" ===
																		er.warranty_status,
																	onCheckedChange: (e) =>
																		ef(
																			"warranty_status",
																			!0 === e
																				? "Active"
																				: "Inactive"
																		),
																}),
																(0, s.jsx)(N.J, {
																	htmlFor:
																		"edit-vehicle-warranty-active",
																	className: "cursor-pointer",
																	children: "Warranty active",
																}),
																(0, s.jsx)("span", {
																	className:
																		"text-xs text-muted-foreground",
																	children:
																		"— quick Active / Inactive switch",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-3 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Warranty start date",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "date",
																			value: er.warranty_start_date,
																			onChange: (e) =>
																				ef(
																					"warranty_start_date",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Warranty end date",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "date",
																			value: er.warranty_end_date,
																			onChange: (e) =>
																				ef(
																					"warranty_end_date",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Warranty KM limit",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "number",
																			min: 0,
																			placeholder: "0",
																			value: er.warranty_km_limit,
																			onChange: (e) =>
																				ef(
																					"warranty_km_limit",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
													],
												}),
												(0, s.jsxs)(S.av, {
													value: "specs",
													className: "space-y-3",
													children: [
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children: "Brand",
																		}),
																		(0, s.jsx)(T.Zi, {
																			options: ew,
																			value: er.brand,
																			onValueChange: (e) =>
																				ef("brand", e),
																			placeholder:
																				"Search brands...",
																			portaled: !0,
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Variant / Trim",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.model_variant,
																			onChange: (e) =>
																				ef(
																					"model_variant",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children: "Model year",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "number",
																			placeholder:
																				"e.g. 2024",
																			value: er.model_year,
																			onChange: (e) =>
																				ef(
																					"model_year",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Production date",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "date",
																			value: er.production_date,
																			onChange: (e) =>
																				ef(
																					"production_date",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children: "Fuel type",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.fuel_type,
																			onValueChange: (e) =>
																				ef("fuel_type", e),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select fuel type",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						P,
																						er.fuel_type
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Transmission",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.transmission,
																			onValueChange: (e) =>
																				ef(
																					"transmission",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select transmission",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						E,
																						er.transmission
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children: "Drive type",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.drive_type,
																			onValueChange: (e) =>
																				ef(
																					"drive_type",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select drive type",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						D,
																						er.drive_type
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Interior material",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.interior_material,
																			onValueChange: (e) =>
																				ef(
																					"interior_material",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select material",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						M,
																						er.interior_material
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Exterior color",
																		}),
																		(0, s.jsx)(C.Z, {
																			doctype: "Color",
																			onCreated: (e) =>
																				ef(
																					"exterior_color",
																					e
																				),
																			children: (0, s.jsx)(
																				T.Zi,
																				{
																					options:
																						eC(eu),
																					value: er.exterior_color,
																					onValueChange:
																						(e) =>
																							ef(
																								"exterior_color",
																								e
																							),
																					onSearchChange:
																						et,
																					placeholder:
																						"Search color...",
																					isLoading: eh,
																					portaled: !0,
																				}
																			),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Interior color",
																		}),
																		(0, s.jsx)(C.Z, {
																			doctype: "Color",
																			onCreated: (e) =>
																				ef(
																					"interior_color",
																					e
																				),
																			children: (0, s.jsx)(
																				T.Zi,
																				{
																					options:
																						eC(ex),
																					value: er.interior_color,
																					onValueChange:
																						(e) =>
																							ef(
																								"interior_color",
																								e
																							),
																					onSearchChange:
																						es,
																					placeholder:
																						"Search color...",
																					isLoading: ep,
																					portaled: !0,
																				}
																			),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Import type",
																		}),
																		(0, s.jsxs)(k.l6, {
																			value: er.import_type,
																			onValueChange: (e) =>
																				ef(
																					"import_type",
																					e
																				),
																			children: [
																				(0, s.jsx)(k.bq, {
																					children: (0,
																					s.jsx)(k.yv, {
																						placeholder:
																							"Select import type",
																					}),
																				}),
																				(0, s.jsx)(k.gC, {
																					children: Q(
																						Z,
																						er.import_type
																					).map((e) =>
																						(0, s.jsx)(
																							k.eb,
																							{
																								value: e,
																								children:
																									e,
																							},
																							e
																						)
																					),
																				}),
																			],
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"First registration date",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "date",
																			value: er.registration_date,
																			onChange: (e) =>
																				ef(
																					"registration_date",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Country of origin",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.registration_country,
																			onChange: (e) =>
																				ef(
																					"registration_country",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Insurance company",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.insurance_company,
																			onChange: (e) =>
																				ef(
																					"insurance_company",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Insurance policy number",
																		}),
																		(0, s.jsx)(b.p, {
																			value: er.insurance_policy_number,
																			onChange: (e) =>
																				ef(
																					"insurance_policy_number",
																					e.target.value
																				),
																		}),
																	],
																}),
																(0, s.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, s.jsx)(N.J, {
																			children:
																				"Insurance expiry date",
																		}),
																		(0, s.jsx)(b.p, {
																			type: "date",
																			value: er.insurance_expiry_date,
																			onChange: (e) =>
																				ef(
																					"insurance_expiry_date",
																					e.target.value
																				),
																		}),
																	],
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className:
																"space-y-2 rounded-md border p-2",
															children: [
																(0, s.jsxs)("div", {
																	className:
																		"flex items-center gap-2",
																	children: [
																		(0, s.jsx)(y.S, {
																			id: "edit-vehicle-fleet",
																			checked:
																				er.is_fleet_vehicle,
																			onCheckedChange: (e) =>
																				ef(
																					"is_fleet_vehicle",
																					!0 === e
																				),
																		}),
																		(0, s.jsx)(N.J, {
																			htmlFor:
																				"edit-vehicle-fleet",
																			className:
																				"cursor-pointer",
																			children:
																				"Fleet vehicle",
																		}),
																	],
																}),
																er.is_fleet_vehicle
																	? (0, s.jsxs)("div", {
																			className:
																				"grid grid-cols-2 gap-2",
																			children: [
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1",
																						children: [
																							(0,
																							s.jsx)(
																								N.J,
																								{
																									children:
																										"Fleet company",
																								}
																							),
																							(0,
																							s.jsx)(
																								T.Zi,
																								{
																									options:
																										ek,
																									value: er.fleet_company,
																									onValueChange:
																										(
																											e
																										) =>
																											ef(
																												"fleet_company",
																												e
																											),
																									onSearchChange:
																										U,
																									placeholder:
																										"Search fleet companies...",
																									portaled:
																										!0,
																								}
																							),
																						],
																					}
																				),
																				(0, s.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1",
																						children: [
																							(0,
																							s.jsx)(
																								N.J,
																								{
																									children:
																										"Fleet reference",
																								}
																							),
																							(0,
																							s.jsx)(
																								b.p,
																								{
																									value: er.fleet_reference,
																									onChange:
																										(
																											e
																										) =>
																											ef(
																												"fleet_reference",
																												e
																													.target
																													.value
																											),
																								}
																							),
																						],
																					}
																				),
																			],
																	  })
																	: null,
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, s.jsx)(N.J, {
																	children: "Special notes",
																}),
																(0, s.jsx)(w.T, {
																	rows: 3,
																	placeholder:
																		"Any special notes about this vehicle...",
																	value: er.special_notes,
																	onChange: (e) =>
																		ef(
																			"special_notes",
																			e.target.value
																		),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, s.jsx)(N.J, {
																	children:
																		"Internal notes (dealership only)",
																}),
																(0, s.jsx)(w.T, {
																	rows: 3,
																	placeholder:
																		"Not shown to the customer...",
																	value: er.internal_notes,
																	onChange: (e) =>
																		ef(
																			"internal_notes",
																			e.target.value
																		),
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, s.jsxs)(j.Es, {
											className: "pt-3",
											children: [
												(0, s.jsx)(f.$, {
													type: "button",
													variant: "outline",
													onClick: () => t(!1),
													disabled: d,
													children: "Cancel",
												}),
												(0, s.jsxs)(f.$, {
													type: "submit",
													disabled: d,
													children: [
														d
															? (0, s.jsx)(p.A, {
																	className:
																		"mr-2 h-4 w-4 animate-spin",
															  })
															: null,
														"Save",
													],
												}),
											],
										}),
									],
								}),
							}),
						}),
						(0, s.jsx)(g.Lt, {
							open: null !== x,
							onOpenChange: (e) => !e && q(null),
							children: (0, s.jsxs)(g.EO, {
								children: [
									(0, s.jsxs)(g.wd, {
										children: [
											(0, s.jsx)(g.r7, {
												children: "Odometer rollback detected",
											}),
											(0, s.jsxs)(g.$v, {
												children: [
													x,
													" The new reading is lower than the one stored on this vehicle. Save it anyway? Only do this when the reading is genuinely lower (for example an instrument cluster replacement).",
												],
											}),
										],
									}),
									(0, s.jsxs)(g.ck, {
										children: [
											(0, s.jsx)(g.Zr, { disabled: d, children: "Go back" }),
											(0, s.jsxs)(g.Rx, {
												disabled: d,
												onClick: (e) => {
													e.preventDefault(), q(null), eA(!0);
												},
												children: [
													d
														? (0, s.jsx)(p.A, {
																className:
																	"mr-2 h-4 w-4 animate-spin",
														  })
														: null,
													"Save anyway",
												],
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
			var q = a(93408),
				B = a(79984),
				R = a(38291),
				H = a(43447),
				U = a(83786),
				K = a(14636),
				G = a(61878),
				Y = a(50049),
				X = a(59222),
				ee = a(66669),
				et = a(439),
				ea = a(41585),
				es = a(60285),
				er = a(7915),
				en = a(49387),
				el = a(68459);
			let ei = [
					{ value: "all", label: "All Statuses" },
					{ value: "In Stock", label: "In Stock" },
					{ value: "Delivered to Customer", label: "Delivered" },
					{ value: "In Service", label: "In Service" },
					{ value: "In Transit", label: "In Transit" },
				],
				ec = [
					{ value: "all", label: "All Warranty" },
					{ value: "Active", label: "Active" },
					{ value: "Inactive", label: "Inactive (expired)" },
					{ value: "Expired by Mileage", label: "Expired (Mileage)" },
					{ value: "Void", label: "Void" },
				];
			function ed() {
				let { navigate: e, viewParams: t } = (0, l.c)(),
					{ canWrite: a, canDelete: v } = (0, d.Sk)(),
					_ = t.get("customer"),
					[j, y] = (0, u.P)("vehicles", "search", ""),
					[N, w] = (0, u.P)("vehicles", "status", "all"),
					[S, C] = (0, u.P)("vehicles", "warranty", "all"),
					[T, A] = (0, u.P)("vehicles", "other_companies", "0"),
					[O, J] = (0, r.useState)(1),
					[$, V] = (0, r.useState)(50),
					[I, P] = (0, r.useState)(null),
					[E, D] = (0, r.useState)(!1),
					[L, M] = (0, r.useState)(null),
					[Z, Q] = (0, r.useState)(null),
					[W, F] = (0, r.useState)(!1),
					ed = "1" === T,
					eo = I ?? L,
					{ data: em, isLoading: eu, error: eh, mutate: ex } = (0, c.W_)(eo);
				(0, r.useEffect)(() => {
					L && em?.name === L && D(!0);
				}, [L, em]),
					(0, r.useEffect)(() => {
						L && eh && (n.o.error("Could not load this vehicle for editing"), M(null));
					}, [L, eh]);
				let ep = {
						customer: _ || void 0,
						search: j || void 0,
						vehicle_status: "all" !== N ? N : void 0,
						warranty_status: "all" !== S ? S : void 0,
						include_other_companies: +!!ed,
					},
					{
						data: ev,
						isLoading: e_,
						error: eg,
						mutate: ej,
					} = (0, c.T$)({ ...ep, limit: $, offset: (O - 1) * $ }),
					ef = ev?.total || 0,
					{
						items: ey,
						loadedCount: eb,
						isLoadingMore: eN,
						loadMore: ew,
					} = (0, m.h)({
						items: ev?.data,
						total: ef,
						offset: (O - 1) * $,
						resetKey: [j, N, S, _ ?? "", T, O, $].join("|"),
						enabled: $ >= m.J,
						fetchMore: async (e, t) =>
							(await h.Mx({ ...ep, limit: t, offset: e })).data,
					});
				function eS(e, t) {
					Q({ name: e, vin_number: t });
				}
				async function ek() {
					if (!Z) return;
					let { name: e } = Z;
					F(!0);
					try {
						await h.ih(e),
							n.o.success("Vehicle deleted"),
							P((t) => (t === e ? null : t)),
							M((t) => (t === e ? null : t)),
							Q(null),
							ej();
					} catch (e) {
						n.o.error(e instanceof Error ? e.message : "Failed to delete vehicle"),
							Q(null);
					} finally {
						F(!1);
					}
				}
				(0, r.useEffect)(() => {
					let e = t.get("id");
					e && P(e);
				}, [t]),
					(0, r.useEffect)(() => {
						J(1);
					}, [j, N, S, _, T]);
				let eC = (0, r.useMemo)(
					() =>
						ey
							? {
									total: ey.length,
									inStock: ey.filter((e) => "In Stock" === e.vehicle_status)
										.length,
									delivered: ey.filter(
										(e) => "Delivered to Customer" === e.vehicle_status
									).length,
									inService: ey.filter((e) => "In Service" === e.vehicle_status)
										.length,
							  }
							: { total: 0, inStock: 0, delivered: 0, inService: 0 },
					[ey]
				);
				return (0, s.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, s.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [
								(0, s.jsxs)("div", {
									className: "min-w-0",
									children: [
										(0, s.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Vehicles",
										}),
										(0, s.jsx)("p", {
											className: _
												? "text-muted-foreground"
												: "mt-1 hidden text-muted-foreground sm:block",
											children: _
												? `Vehicles for ${_}`
												: "Manage vehicle inventory (VIN records)",
										}),
									],
								}),
								(0, s.jsx)(i.l, {
									module: "vehicles",
									label: "New Vehicle",
									onClick: () => e("vehicle-new"),
								}),
							],
						}),
						(0, s.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
							children: [
								(0, s.jsx)(B.Zp, {
									className: "dms-kpi-card",
									children: (0, s.jsx)(B.Wu, {
										className: "px-3.5 py-3",
										children: (0, s.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, s.jsx)("div", {
													className: "rounded-full bg-primary/10 p-1.5",
													children: (0, s.jsx)(K.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, s.jsxs)("div", {
													children: [
														(0, s.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: eC.total,
														}),
														(0, s.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Total Vehicles",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, s.jsx)(B.Zp, {
									className: "dms-kpi-card",
									children: (0, s.jsx)(B.Wu, {
										className: "px-3.5 py-3",
										children: (0, s.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, s.jsx)("div", {
													className:
														"rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30",
													children: (0, s.jsx)(K.A, {
														className:
															"h-3.5 w-3.5 text-blue-600 dark:text-blue-400",
													}),
												}),
												(0, s.jsxs)("div", {
													children: [
														(0, s.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: eC.inStock,
														}),
														(0, s.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "In Stock",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, s.jsx)(B.Zp, {
									className: "dms-kpi-card",
									children: (0, s.jsx)(B.Wu, {
										className: "px-3.5 py-3",
										children: (0, s.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, s.jsx)("div", {
													className:
														"rounded-full bg-green-100 p-1.5 dark:bg-green-900/30",
													children: (0, s.jsx)(K.A, {
														className:
															"h-3.5 w-3.5 text-green-600 dark:text-green-400",
													}),
												}),
												(0, s.jsxs)("div", {
													children: [
														(0, s.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: eC.delivered,
														}),
														(0, s.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "Delivered",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, s.jsx)(B.Zp, {
									className: "dms-kpi-card",
									children: (0, s.jsx)(B.Wu, {
										className: "px-3.5 py-3",
										children: (0, s.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, s.jsx)("div", {
													className:
														"rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30",
													children: (0, s.jsx)(K.A, {
														className:
															"h-3.5 w-3.5 text-amber-600 dark:text-amber-400",
													}),
												}),
												(0, s.jsxs)("div", {
													children: [
														(0, s.jsx)("p", {
															className: "dms-stat-value text-xl",
															children: eC.inService,
														}),
														(0, s.jsx)("p", {
															className:
																"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
															children: "In Service",
														}),
													],
												}),
											],
										}),
									}),
								}),
							],
						}),
						(0, s.jsx)(B.Zp, {
							className: "dms-toolbar-card",
							children: (0, s.jsx)(B.Wu, {
								className: "px-3.5 py-3",
								children: (0, s.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row",
									children: [
										(0, s.jsxs)("div", {
											className: "relative flex-1",
											children: [
												(0, s.jsx)(G.A, {
													className:
														"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
												}),
												(0, s.jsx)(b.p, {
													placeholder:
														"Search by VIN, plate, model, customer...",
													className: "pl-9",
													value: j,
													onChange: (e) => y(e.target.value),
												}),
											],
										}),
										(0, s.jsxs)(k.l6, {
											value: N,
											onValueChange: w,
											children: [
												(0, s.jsx)(k.bq, {
													className: "w-full sm:w-[180px]",
													children: (0, s.jsx)(k.yv, {}),
												}),
												(0, s.jsx)(k.gC, {
													children: ei.map((e) =>
														(0, s.jsx)(
															k.eb,
															{ value: e.value, children: e.label },
															e.value
														)
													),
												}),
											],
										}),
										(0, s.jsxs)(k.l6, {
											value: S,
											onValueChange: C,
											children: [
												(0, s.jsx)(k.bq, {
													className: "w-full sm:w-[180px]",
													children: (0, s.jsx)(k.yv, {}),
												}),
												(0, s.jsx)(k.gC, {
													children: ec.map((e) =>
														(0, s.jsx)(
															k.eb,
															{ value: e.value, children: e.label },
															e.value
														)
													),
												}),
											],
										}),
										a("vehicles")
											? (0, s.jsxs)(f.$, {
													variant: ed ? "default" : "outline",
													className: "gap-2",
													onClick: () => A(ed ? "0" : "1"),
													title: "Include vehicles whose company is not selected in DMS Settings",
													children: [
														(0, s.jsx)(Y.A, {
															className: "h-4 w-4 shrink-0",
														}),
														ed
															? "Showing other companies"
															: "Show other companies",
													],
											  })
											: null,
										_ &&
											(0, s.jsx)(f.$, {
												variant: "outline",
												size: "sm",
												onClick: () => e("vehicles"),
												children: "Clear customer filter",
											}),
									],
								}),
							}),
						}),
						(0, s.jsxs)(B.Zp, {
							children: [
								(0, s.jsx)(B.aR, {
									children: (0, s.jsx)(B.ZB, { children: "Vehicle Inventory" }),
								}),
								(0, s.jsxs)(B.Wu, {
									children: [
										e_
											? (0, s.jsx)("div", {
													className:
														"flex items-center justify-center h-48",
													children: (0, s.jsx)(p.A, {
														className:
															"h-8 w-8 animate-spin text-muted-foreground",
													}),
											  })
											: eg
											? (0, s.jsx)("div", {
													className:
														"flex items-center justify-center h-48 text-muted-foreground",
													children: "Failed to load vehicles",
											  })
											: ey && ey.length > 0
											? (0, s.jsx)("div", {
													className: "dms-table-panel",
													children: (0, s.jsxs)(U.XI, {
														children: [
															(0, s.jsx)(U.A0, {
																children: (0, s.jsxs)(U.Hj, {
																	children: [
																		(0, s.jsx)(U.nd, {
																			children:
																				"VIN / Chassis",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Model",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Plate",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Customer",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Odometer",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Warranty",
																		}),
																		(0, s.jsx)(U.nd, {
																			children: "Status",
																		}),
																		ed
																			? (0, s.jsx)(U.nd, {
																					children:
																						"Company",
																			  })
																			: null,
																		(0, s.jsx)(U.nd, {
																			className:
																				"w-[1%] text-right",
																			children: "Actions",
																		}),
																	],
																}),
															}),
															(0, s.jsx)(U.BF, {
																children: ey.map((t) =>
																	(0, s.jsxs)(
																		U.Hj,
																		{
																			className:
																				"cursor-pointer hover:bg-muted/50",
																			onClick: () =>
																				P(t.name),
																			children: [
																				(0, s.jsx)(U.nA, {
																					children: (0,
																					s.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									s.jsx)(
																										"span",
																										{
																											className:
																												"font-medium text-sm font-mono",
																											children:
																												t.vin_number,
																										}
																									),
																									t.engine_number &&
																										(0,
																										s.jsxs)(
																											"p",
																											{
																												className:
																													"text-[10px] text-muted-foreground mt-0.5",
																												children:
																													[
																														"Eng: ",
																														t.engine_number,
																													],
																											}
																										),
																								],
																						}
																					),
																				}),
																				(0, s.jsx)(U.nA, {
																					children: (0,
																					s.jsxs)(
																						"div",
																						{
																							children:
																								[
																									(0,
																									s.jsx)(
																										"span",
																										{
																											className:
																												"font-medium text-sm",
																											children:
																												t.model_name ||
																												t.linked_item ||
																												"—",
																										}
																									),
																									(0,
																									s.jsxs)(
																										"div",
																										{
																											className:
																												"flex items-center gap-2 mt-0.5",
																											children:
																												[
																													t.model_year &&
																														(0,
																														s.jsx)(
																															"span",
																															{
																																className:
																																	"text-xs text-muted-foreground",
																																children:
																																	t.model_year,
																															}
																														),
																													t.fuel_type &&
																														(0,
																														s.jsxs)(
																															"span",
																															{
																																className:
																																	"flex items-center gap-0.5 text-[10px] text-muted-foreground",
																																children:
																																	[
																																		(0,
																																		s.jsx)(
																																			X.A,
																																			{
																																				className:
																																					"h-2.5 w-2.5",
																																			}
																																		),
																																		t.fuel_type,
																																	],
																															}
																														),
																												],
																										}
																									),
																								],
																						}
																					),
																				}),
																				(0, s.jsx)(U.nA, {
																					className:
																						"font-mono text-sm",
																					children:
																						t.plate_number ||
																						"—",
																				}),
																				(0, s.jsx)(U.nA, {
																					children:
																						t.customer_name
																							? (0,
																							  s.jsx)(
																									"button",
																									{
																										className:
																											"text-sm hover:text-primary hover:underline",
																										onClick:
																											(
																												a
																											) => {
																												a.stopPropagation(),
																													e(
																														"vehicles",
																														{
																															customer:
																																t.current_customer,
																														}
																													);
																											},
																										children:
																											t.customer_name,
																									}
																							  )
																							: (0,
																							  s.jsx)(
																									"span",
																									{
																										className:
																											"text-muted-foreground text-sm",
																										children:
																											"No owner",
																									}
																							  ),
																				}),
																				(0, s.jsx)(U.nA, {
																					children:
																						null !=
																						t.current_odometer
																							? (0,
																							  s.jsxs)(
																									"span",
																									{
																										className:
																											"flex items-center gap-1 text-sm",
																										children:
																											[
																												(0,
																												s.jsx)(
																													ee.A,
																													{
																														className:
																															"h-3 w-3 text-muted-foreground",
																													}
																												),
																												t.current_odometer.toLocaleString(),
																												" ",
																												t.odometer_unit ||
																													"km",
																											],
																									}
																							  )
																							: "—",
																				}),
																				(0, s.jsx)(U.nA, {
																					children:
																						t.warranty_status
																							? (0,
																							  s.jsxs)(
																									R.E,
																									{
																										variant:
																											"outline",
																										className: `text-[10px] gap-1 ${
																											{
																												Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
																												Inactive:
																													"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
																												"Expired by Time":
																													"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
																												"Expired by Mileage":
																													"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
																												Void: "bg-muted text-muted-foreground",
																												"Pending Verification":
																													"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
																											}[
																												t.warranty_status ||
																													""
																											] ||
																											""
																										}`,
																										children:
																											[
																												"Active" ===
																													t.warranty_status &&
																													(0,
																													s.jsx)(
																														et.A,
																														{
																															className:
																																"h-2.5 w-2.5",
																														}
																													),
																												("Inactive" ===
																													t.warranty_status ||
																													t.warranty_status?.startsWith(
																														"Expired"
																													) ||
																													"Void" ===
																														t.warranty_status) &&
																													(0,
																													s.jsx)(
																														ea.A,
																														{
																															className:
																																"h-2.5 w-2.5",
																														}
																													),
																												t.warranty_status,
																											],
																									}
																							  )
																							: "—",
																				}),
																				(0, s.jsx)(U.nA, {
																					children:
																						t.vehicle_status
																							? (0,
																							  s.jsx)(
																									R.E,
																									{
																										variant:
																											"outline",
																										className: `text-[10px] ${
																											{
																												"In Stock":
																													"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
																												"Delivered to Customer":
																													"bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
																												"In Service":
																													"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
																												"In Transit":
																													"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
																												"Total Loss":
																													"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
																												Scrapped:
																													"bg-muted text-muted-foreground",
																											}[
																												t.vehicle_status ||
																													""
																											] ||
																											"bg-muted text-muted-foreground"
																										}`,
																										children:
																											t.vehicle_status,
																									}
																							  )
																							: "—",
																				}),
																				ed
																					? (0, s.jsx)(
																							U.nA,
																							{
																								className:
																									"text-muted-foreground text-xs",
																								children:
																									(0,
																									s.jsx)(
																										"span",
																										{
																											className:
																												"block max-w-[160px] truncate",
																											title:
																												t.company ||
																												void 0,
																											children:
																												t.company ||
																												"—",
																										}
																									),
																							}
																					  )
																					: null,
																				(0, s.jsx)(U.nA, {
																					onClick: (e) =>
																						e.stopPropagation(),
																					children: (0,
																					s.jsx)(q.m, {
																						doctype:
																							"VIN No",
																						docName:
																							t.name,
																						children:
																							(0,
																							s.jsxs)(
																								H.rI,
																								{
																									children:
																										[
																											(0,
																											s.jsx)(
																												H.ty,
																												{
																													asChild:
																														!0,
																													children:
																														(0,
																														s.jsxs)(
																															f.$,
																															{
																																variant:
																																	"ghost",
																																size: "icon",
																																className:
																																	"h-8 w-8 shrink-0",
																																children:
																																	[
																																		(0,
																																		s.jsx)(
																																			es.A,
																																			{
																																				className:
																																					"h-4 w-4",
																																			}
																																		),
																																		(0,
																																		s.jsx)(
																																			"span",
																																			{
																																				className:
																																					"sr-only",
																																				children:
																																					"Actions",
																																			}
																																		),
																																	],
																															}
																														),
																												}
																											),
																											(0,
																											s.jsxs)(
																												H.SQ,
																												{
																													align: "end",
																													children:
																														[
																															(0,
																															s.jsxs)(
																																H._2,
																																{
																																	onClick:
																																		() =>
																																			P(
																																				t.name
																																			),
																																	children:
																																		[
																																			(0,
																																			s.jsx)(
																																				er.A,
																																				{
																																					className:
																																						"mr-2 h-4 w-4",
																																				}
																																			),
																																			"View Details",
																																		],
																																}
																															),
																															a(
																																"vehicles"
																															)
																																? (0,
																																  s.jsxs)(
																																		H._2,
																																		{
																																			onClick:
																																				() => {
																																					P(
																																						(
																																							e
																																						) =>
																																							e &&
																																							e !==
																																								t.name
																																								? null
																																								: e
																																					),
																																						M(
																																							t.name
																																						);
																																				},
																																			children:
																																				[
																																					(0,
																																					s.jsx)(
																																						en.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Edit Vehicle",
																																				],
																																		}
																																  )
																																: null,
																															v(
																																"vehicles"
																															)
																																? (0,
																																  s.jsxs)(
																																		H._2,
																																		{
																																			className:
																																				"text-destructive focus:text-destructive",
																																			onClick:
																																				() =>
																																					eS(
																																						t.name,
																																						t.vin_number
																																					),
																																			children:
																																				[
																																					(0,
																																					s.jsx)(
																																						el.A,
																																						{
																																							className:
																																								"mr-2 h-4 w-4",
																																						}
																																					),
																																					"Delete",
																																				],
																																		}
																																  )
																																: null,
																														],
																												}
																											),
																										],
																								}
																							),
																					}),
																				}),
																			],
																		},
																		t.name
																	)
																),
															}),
														],
													}),
											  })
											: (0, s.jsxs)("div", {
													className:
														"flex flex-col items-center justify-center h-48 text-muted-foreground",
													children: [
														(0, s.jsx)(K.A, {
															className: "h-12 w-12 mb-4 opacity-50",
														}),
														(0, s.jsx)("p", {
															children: "No vehicles found",
														}),
														(0, s.jsx)(f.$, {
															variant: "link",
															className: "mt-2",
															onClick: () => e("vehicle-new"),
															children: "Register a new vehicle",
														}),
													],
											  }),
										(0, s.jsx)(o.$, {
											page: O,
											pageSize: $,
											totalItems: ef,
											loadedCount: eb,
											onPageChange: J,
											onPageSizeChange: V,
											onLoadMore: ew,
											isLoadingMore: eN,
										}),
									],
								}),
							],
						}),
						(0, s.jsx)(x.BN, {
							open: !!I && !E,
							onOpenChange: (e) => !e && P(null),
							title: em?.vin_number || I || "",
							subtitle: em?.model_name
								? `${em.model_name} ${em.model_year || ""}`.trim()
								: void 0,
							badge: em?.vehicle_status ? { label: em.vehicle_status } : void 0,
							isLoading: eu,
							footer:
								em && (a("vehicles") || v("vehicles"))
									? (0, s.jsxs)("div", {
											className:
												"flex flex-col gap-2 sm:flex-row sm:justify-end",
											children: [
												v("vehicles")
													? (0, s.jsxs)(f.$, {
															variant: "outline",
															className:
																"w-full text-destructive hover:text-destructive sm:w-auto",
															onClick: () =>
																eS(em.name, em.vin_number),
															children: [
																(0, s.jsx)(el.A, {
																	className: "h-4 w-4 mr-2",
																}),
																"Delete Vehicle",
															],
													  })
													: null,
												a("vehicles")
													? (0, s.jsxs)(f.$, {
															className: "w-full sm:w-auto",
															onClick: () => D(!0),
															children: [
																(0, s.jsx)(en.A, {
																	className: "h-4 w-4 mr-2",
																}),
																"Edit Vehicle",
															],
													  })
													: null,
											],
									  })
									: null,
							children:
								em &&
								(0, s.jsxs)(s.Fragment, {
									children: [
										(0, s.jsxs)(x.JH, {
											title: "Identification",
											children: [
												(0, s.jsx)(x.Qb, {
													label: "VIN Number",
													value: em.vin_number,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Engine Number",
													value: em.engine_number,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Plate Number",
													value: em.plate_number,
												}),
											],
										}),
										(0, s.jsxs)(x.JH, {
											title: "Specifications",
											children: [
												(0, s.jsx)(x.Qb, {
													label: "Model",
													value: em.model_name,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Year",
													value: em.model_year,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Brand",
													value: em.brand,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Fuel Type",
													value: em.fuel_type,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Transmission",
													value: em.transmission,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Exterior Color",
													value: em.exterior_color,
												}),
											],
										}),
										(0, s.jsxs)(x.JH, {
											title: "Ownership",
											children: [
												(0, s.jsx)(x.Qb, {
													label: "Customer ID",
													value: em.current_customer,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Customer Name",
													value: em.customer_name,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Mobile",
													value: em.owner_mobile,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Email",
													value: em.owner_email,
												}),
												(0, s.jsx)(x.Qb, {
													label: "TIN No",
													value: em.owner_tax_id,
												}),
												(em.customer_history?.length ?? 0) > 0 &&
													(0, s.jsxs)("div", {
														className: "mt-2 space-y-2",
														children: [
															(0, s.jsx)("p", {
																className:
																	"text-xs font-medium text-muted-foreground",
																children: "Previous customers",
															}),
															em.customer_history
																?.filter((e) => !e.is_current)
																.map((e) =>
																	(0, s.jsxs)(
																		"div",
																		{
																			className:
																				"rounded-md border px-3 py-2 text-sm",
																			children: [
																				(0, s.jsx)("p", {
																					className:
																						"font-medium",
																					children:
																						e.customer_name ||
																						e.customer,
																				}),
																				(0, s.jsx)("p", {
																					className:
																						"text-muted-foreground",
																					children: [
																						e.mobile_no,
																						e.from_date &&
																							`from ${e.from_date}`,
																						e.to_date &&
																							`to ${e.to_date}`,
																					]
																						.filter(
																							Boolean
																						)
																						.join(
																							" \xb7 "
																						),
																				}),
																			],
																		},
																		e.name ||
																			`${e.customer}-${e.from_date}`
																	)
																),
														],
													}),
											],
										}),
										(0, s.jsxs)(x.JH, {
											title: "Status",
											children: [
												(0, s.jsx)(x.Qb, {
													label: "Odometer",
													value:
														null != em.current_odometer
															? `${em.current_odometer.toLocaleString()} km`
															: void 0,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Warranty Status",
													value: em.warranty_status,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Warranty End Date",
													value: em.warranty_end_date,
												}),
												(0, s.jsx)(x.Qb, {
													label: "Vehicle Status",
													value: em.vehicle_status,
												}),
											],
										}),
									],
								}),
						}),
						(0, s.jsx)(z, {
							open: E,
							onOpenChange: (e) => {
								D(e), e || M(null);
							},
							vehicle: em || null,
							onUpdated: () => {
								ex();
							},
						}),
						(0, s.jsx)(g.Lt, {
							open: !!Z,
							onOpenChange: (e) => {
								e || W || Q(null);
							},
							children: (0, s.jsxs)(g.EO, {
								children: [
									(0, s.jsxs)(g.wd, {
										children: [
											(0, s.jsx)(g.r7, { children: "Delete vehicle" }),
											(0, s.jsxs)(g.$v, {
												children: [
													"Delete ",
													(0, s.jsx)("strong", {
														children: Z?.vin_number || Z?.name,
													}),
													"? The VIN record is removed permanently. Documents that still reference it — service estimates, job cards, appointments, invoices — must be deleted first.",
												],
											}),
										],
									}),
									(0, s.jsxs)(g.ck, {
										children: [
											(0, s.jsx)(g.Zr, {
												disabled: W,
												children: "Keep vehicle",
											}),
											(0, s.jsx)(g.Rx, {
												className:
													"bg-destructive text-destructive-foreground hover:bg-destructive/90",
												disabled: W,
												onClick: (e) => {
													e.preventDefault(), ek();
												},
												children: W
													? (0, s.jsxs)(s.Fragment, {
															children: [
																(0, s.jsx)(p.A, {
																	className:
																		"h-4 w-4 mr-2 animate-spin",
																}),
																"Deleting…",
															],
													  })
													: "Delete vehicle",
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
		61991: (e, t, a) => {
			a.d(t, { w: () => l });
			var s = a(95155);
			a(12115);
			var r = a(89803),
				n = a(91337);
			function l({ className: e, orientation: t = "horizontal", decorative: a = !0, ...i }) {
				return (0, s.jsx)(r.b, {
					"data-slot": "separator",
					decorative: a,
					orientation: t,
					className: (0, n.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...i,
				});
			}
		},
		66348: (e, t, a) => {
			a.d(t, {
				$K: () => g,
				AQ: () => P,
				CD: () => n,
				E3: () => p,
				Fe: () => v,
				Jm: () => x,
				Lo: () => N,
				MH: () => A,
				PJ: () => f,
				Qn: () => o,
				RJ: () => V,
				TQ: () => J,
				WA: () => _,
				XF: () => O,
				YM: () => c,
				YW: () => m,
				Z6: () => E,
				Z7: () => w,
				_1: () => S,
				_B: () => T,
				aL: () => b,
				b3: () => C,
				kZ: () => $,
				kd: () => I,
				mU: () => k,
				nY: () => d,
				ns: () => D,
				qS: () => y,
				qr: () => u,
				rv: () => j,
				vS: () => l,
				wu: () => i,
				xb: () => h,
			});
			var s = a(49876);
			let r = "dms.api.masters";
			async function n(e) {
				return (0, s.AT)(`/api/method/${r}.list_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						include_discontinued: +!!e?.include_discontinued,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function l(e) {
				return (0, s.AT)(`/api/method/${r}.get_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function i(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function c(e) {
				return (0, s.AT)(`/api/method/${r}.list_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
						active_filter: e?.active_filter || "active",
					}),
				});
			}
			async function d(e) {
				return (0, s.AT)(`/api/method/${r}.get_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function o(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function m(e) {
				return (0, s.AT)(`/api/method/${r}.create_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function u(e, t) {
				return (0, s.AT)(`/api/method/${r}.add_vehicle_service_item_models`, {
					method: "POST",
					body: JSON.stringify({ name: e, vehicle_models: t }),
				});
			}
			async function h(e) {
				return (0, s.AT)(`/api/method/${r}.list_vehicle_service_item_names`, {
					method: "POST",
					body: JSON.stringify({ search: e?.search || null, limit: e?.limit ?? 100 }),
				});
			}
			async function x(e) {
				return (0, s.AT)(`/api/method/${r}.bulk_update_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function p(e) {
				return (0, s.AT)(`/api/method/${r}.list_item_prices`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						price_list: e?.price_list || null,
						selling: +(e?.selling !== !1),
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function v(e) {
				return (0, s.AT)(`/api/method/${r}.get_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function _(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function g(e) {
				return (0, s.AT)(`/api/method/${r}.create_item_price`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function j(e) {
				return (0, s.AT)(`/api/method/${r}.list_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function f(e) {
				return (0, s.AT)(`/api/method/${r}.create_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function y(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function b(e) {
				return (0, s.AT)(`/api/method/${r}.delete_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function N(e) {
				return (0, s.AT)(`/api/method/${r}.list_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function w(e) {
				return (0, s.AT)(`/api/method/${r}.create_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function S(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function k(e) {
				return (0, s.AT)(`/api/method/${r}.delete_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function C(e) {
				return (0, s.AT)(`/api/method/${r}.list_vehicle_models`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						brand: e?.brand || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function T(e) {
				return (0, s.AT)(`/api/method/${r}.get_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function A(e) {
				return (0, s.AT)(`/api/method/${r}.create_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function O(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function J(e, t) {
				return (0, s.AT)(`/api/method/${r}.create_vehicle_item_group`, {
					method: "POST",
					body: JSON.stringify({ item_group: e, parent_item_group: t || null }),
				});
			}
			async function $() {
				return (0, s.AT)(`/api/method/${r}.get_masters_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function V(e) {
				return (0, s.AT)(`/api/method/${r}.list_vehicle_service_packages`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function I(e) {
				return (0, s.AT)(`/api/method/${r}.get_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function P(e) {
				return (0, s.AT)(`/api/method/${r}.create_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function E(e, t) {
				return (0, s.AT)(`/api/method/${r}.update_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function D(e) {
				return (0, s.AT)(`/api/method/${r}.delete_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
		},
		70521: (e, t, a) => {
			a.d(t, {
				$v: () => x,
				EO: () => o,
				Lt: () => i,
				Rx: () => p,
				Zr: () => v,
				ck: () => u,
				r7: () => h,
				wd: () => m,
			});
			var s = a(95155);
			a(12115);
			var r = a(284),
				n = a(91337),
				l = a(4474);
			function i({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "alert-dialog", ...e });
			}
			function c({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, s.jsxs)(c, {
					children: [
						(0, s.jsx)(d, {}),
						(0, s.jsx)(r.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, n.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, n.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, n.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, s.jsx)(r.rc, { className: (0, n.cn)((0, l.r)(), e), ...t });
			}
			function v({ className: e, ...t }) {
				return (0, s.jsx)(r.ZD, {
					className: (0, n.cn)((0, l.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		79984: (e, t, a) => {
			a.d(t, { BT: () => c, Wu: () => d, ZB: () => i, Zp: () => n, aR: () => l });
			var s = a(95155);
			a(12115);
			var r = a(91337);
			function n({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card",
					className: (0, r.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-header",
					className: (0, r.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-title",
					className: (0, r.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-content",
					className: (0, r.cn)("px-4", e),
					...t,
				});
			}
		},
		84437: (e, t, a) => {
			a.d(t, { S: () => i });
			var s = a(95155);
			a(12115);
			var r = a(47279),
				n = a(94514),
				l = a(91337);
			function i({ className: e, ...t }) {
				return (0, s.jsx)(r.bL, {
					"data-slot": "checkbox",
					className: (0, l.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...t,
					children: (0, s.jsx)(r.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, s.jsx)(n.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		98883: (e, t, a) => {
			a.d(t, { Qb: () => j, JH: () => g, BN: () => _ });
			var s = a(95155);
			a(12115);
			var r = a(29483),
				n = a(33210),
				l = a(91337);
			function i({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "sheet", ...e });
			}
			function c({ ...e }) {
				return (0, s.jsx)(r.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function d({ className: e, ...t }) {
				return (0, s.jsx)(r.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, l.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, children: t, side: a = "right", ...i }) {
				return (0, s.jsxs)(c, {
					children: [
						(0, s.jsx)(d, {}),
						(0, s.jsxs)(r.UC, {
							"data-slot": "sheet-content",
							className: (0, l.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === a &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === a &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === a &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === a &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...i,
							children: [
								t,
								(0, s.jsxs)(r.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, s.jsx)(n.A, { className: "size-4" }),
										(0, s.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, l.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, s.jsx)(r.hE, {
					"data-slot": "sheet-title",
					className: (0, l.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, s.jsx)(r.VY, {
					"data-slot": "sheet-description",
					className: (0, l.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var x = a(38291),
				p = a(61991),
				v = a(6296);
			function _({
				open: e,
				onOpenChange: t,
				title: a,
				subtitle: r,
				badge: n,
				isLoading: c,
				onOpenInDesk: d,
				footer: g,
				contentScroll: j = "outer",
				children: f,
			}) {
				return (0, s.jsx)(i, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(o, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, s.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, s.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, s.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, s.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, s.jsx)(u, {
														className: "text-lg",
														children: a,
													}),
													n &&
														(0, s.jsx)(x.E, {
															variant: n.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: n.label,
														}),
												],
											}),
											r && (0, s.jsx)(h, { className: "mt-1", children: r }),
										],
									}),
								}),
							}),
							(0, s.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							c
								? (0, s.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, s.jsx)(v.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsx)("div", {
												className: (0, l.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === j
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: f,
											}),
											g &&
												(0, s.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: g,
												}),
										],
								  }),
						],
					}),
				});
			}
			function g({ title: e, children: t, className: a }) {
				return (0, s.jsxs)("div", {
					className: (0, l.cn)("space-y-2", a),
					children: [
						(0, s.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, s.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, s.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: t,
						}),
					],
				});
			}
			function j({ label: e, value: t, className: a }) {
				return (0, s.jsxs)("div", {
					className: (0, l.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						a
					),
					children: [
						(0, s.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, s.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: t || "—",
						}),
					],
				});
			}
		},
	},
]);
