"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1887],
	{
		12651: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		15306: (e, t, s) => {
			s.d(t, { Xi: () => l, av: () => c, j7: () => d, tU: () => n });
			var i = s(95155);
			s(12115);
			var a = s(57518),
				r = s(91337);
			function n({ className: e, ...t }) {
				return (0, i.jsx)(a.bL, {
					"data-slot": "tabs",
					className: (0, r.cn)("flex flex-col gap-2", e),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, i.jsx)(a.B8, {
					"data-slot": "tabs-list",
					className: (0, r.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, i.jsx)(a.l9, {
					"data-slot": "tabs-trigger",
					className: (0, r.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, i.jsx)(a.UC, {
					"data-slot": "tabs-content",
					className: (0, r.cn)("outline-none data-[state=inactive]:hidden", e),
					...t,
				});
			}
		},
		16516: (e, t, s) => {
			function i(e) {
				let t = Number(e);
				return Number.isFinite(t) ? t : 0;
			}
			function a(e) {
				return 1 === i(e.docstatus) && !e.job_card && !e.service_estimate;
			}
			s.d(t, { O: () => i, Y: () => a });
		},
		21283: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("stethoscope", [
				["path", { d: "M11 2v2", key: "1539x4" }],
				["path", { d: "M5 2v2", key: "1yf1q8" }],
				[
					"path",
					{
						d: "M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1",
						key: "rb5t3r",
					},
				],
				["path", { d: "M8 15a6 6 0 0 0 12 0v-3", key: "x18d4x" }],
				["circle", { cx: "20", cy: "10", r: "2", key: "ts1r5v" }],
			]);
		},
		24268: (e, t, s) => {
			s.r(t), s.d(t, { default: () => R });
			var i = s(95155),
				a = s(81672),
				r = s(12115),
				n = s(55833),
				d = s(36020),
				l = s(4474),
				c = s(79984),
				o = s(38291),
				m = s(61991),
				x = s(15306),
				u = s(12651),
				h = s(13545),
				p = s(62791),
				g = s(41585),
				j = s(80723),
				f = s(49387),
				v = s(93053),
				N = s(21283),
				b = s(48368),
				y = s(66669),
				_ = s(59222),
				w = s(42869),
				A = s(57420),
				k = s(14636),
				S = s(66609),
				C = s(49580),
				$ = s(41431),
				Z = s(16516);
			let z = {
					Draft: { label: "Draft", variant: "secondary" },
					Submitted: { label: "Submitted", variant: "default" },
					Approved: { label: "Approved", variant: "default" },
				},
				M = {
					Good: { icon: u.A, color: "text-[#2E7D32]", label: "Good" },
					Fair: { icon: h.A, color: "text-[#F9A825]", label: "Fair" },
					Poor: { icon: p.A, color: "text-[#D32F2F]", label: "Poor" },
					"N/A": { icon: h.A, color: "text-muted-foreground", label: "N/A" },
				};
			function W({ condition: e }) {
				let t = M[e] || M["N/A"],
					s = t.icon;
				return (0, i.jsxs)("div", {
					className: `flex items-center gap-1.5 ${t.color}`,
					children: [
						(0, i.jsx)(s, { className: "h-4 w-4" }),
						(0, i.jsx)("span", {
							className: "text-sm font-medium",
							children: t.label,
						}),
					],
				});
			}
			function F({ label: e, condition: t, notes: s }) {
				return (0, i.jsxs)("div", {
					className:
						"flex items-start justify-between py-3 border-b border-border last:border-0",
					children: [
						(0, i.jsxs)("div", {
							className: "flex-1",
							children: [
								(0, i.jsx)("p", {
									className: "font-medium text-foreground",
									children: e,
								}),
								s &&
									(0, i.jsx)("p", {
										className: "text-sm text-muted-foreground mt-1",
										children: s,
									}),
							],
						}),
						(0, i.jsx)(W, { condition: t }),
					],
				});
			}
			function R() {
				let { viewParams: e, navigate: t } = (0, n.c)(),
					s = e.get("id") || "",
					{ data: u, isLoading: h, error: p, mutate: M } = (0, d.K5)(s),
					{ trigger: R, isMutating: D } = (0, d.il)(s),
					[T, I] = (0, r.useState)("overview"),
					[B, L] = (0, r.useState)(!1);
				if (!s)
					return (0, i.jsxs)("div", {
						className: "flex flex-col items-center justify-center h-96 gap-4",
						children: [
							(0, i.jsx)(g.A, { className: "h-12 w-12 text-destructive" }),
							(0, i.jsx)("p", {
								className: "text-lg text-muted-foreground",
								children: "No inspection ID provided",
							}),
							(0, i.jsx)(l.$, {
								variant: "outline",
								onClick: () => t("inspections"),
								children: "Back to Inspections",
							}),
						],
					});
				let P = async () => {
						try {
							await R(), S.o.success("Inspection submitted successfully"), M();
						} catch {
							S.o.error("Failed to submit inspection");
						}
					},
					E = async () => {
						L(!0);
						try {
							let e = await $.tc(s);
							S.o.success("Service estimate created — add diagnosis findings"),
								M(),
								t("estimate-detail", { id: e });
						} catch (e) {
							S.o.error(
								e instanceof Error ? e.message : "Failed to start diagnosis"
							);
						} finally {
							L(!1);
						}
					};
				if (h)
					return (0, i.jsx)("div", {
						className: "flex items-center justify-center h-96",
						children: (0, i.jsx)("div", {
							className:
								"animate-spin rounded-full h-8 w-8 border-b-2 border-primary",
						}),
					});
				if (p || !u)
					return (0, i.jsxs)("div", {
						className: "flex flex-col items-center justify-center h-96 gap-4",
						children: [
							(0, i.jsx)(g.A, { className: "h-12 w-12 text-destructive" }),
							(0, i.jsx)("p", {
								className: "text-lg text-muted-foreground",
								children: "Failed to load inspection",
							}),
							(0, i.jsx)(l.$, {
								variant: "outline",
								onClick: () => t("inspections"),
								children: "Go Back",
							}),
						],
					});
				let V = u.fuel_level_percentage || 0,
					O = 1 === (0, Z.O)(u.docstatus),
					q = 0 === (0, Z.O)(u.docstatus),
					H = (0, Z.Y)(u),
					U = O ? "Submitted" : q ? "Draft" : "Cancelled";
				return (0, i.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, i.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, i.jsxs)("div", {
									className: "flex items-center gap-4",
									children: [
										(0, i.jsx)(l.$, {
											variant: "ghost",
											size: "icon",
											onClick: () => t("inspections"),
											children: (0, i.jsx)(j.A, { className: "h-5 w-5" }),
										}),
										(0, i.jsxs)("div", {
											children: [
												(0, i.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [
														(0, i.jsx)("h1", {
															className:
																"dms-stat-value text-xl text-foreground",
															children: u.name,
														}),
														(0, i.jsx)(o.E, {
															variant: z[U]?.variant || "secondary",
															children: U,
														}),
													],
												}),
												(0, i.jsxs)("p", {
													className: "text-muted-foreground mt-1",
													children: [
														u.vehicle_registration,
														" - ",
														u.vehicle_model,
													],
												}),
											],
										}),
									],
								}),
								(0, i.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										s &&
											(0, i.jsx)(C.e, {
												doctype: "Vehicle Inspection",
												docName: s,
											}),
										q &&
											(0, i.jsxs)(i.Fragment, {
												children: [
													(0, i.jsxs)(l.$, {
														variant: "outline",
														size: "sm",
														onClick: () =>
															t("inspection-new", { id: s }),
														children: [
															(0, i.jsx)(f.A, {
																className: "h-4 w-4 mr-2",
															}),
															"Continue Editing",
														],
													}),
													(0, i.jsxs)(l.$, {
														size: "sm",
														onClick: P,
														disabled: D,
														children: [
															(0, i.jsx)(v.A, {
																className: "h-4 w-4 mr-2",
															}),
															"Submit",
														],
													}),
												],
											}),
										H &&
											(0, i.jsxs)(l.$, {
												size: "sm",
												onClick: E,
												disabled: B,
												children: [
													(0, i.jsx)(N.A, { className: "h-4 w-4 mr-2" }),
													B ? "Creating..." : "Start diagnosis",
												],
											}),
										O &&
											u.service_estimate &&
											(0, i.jsxs)(l.$, {
												size: "sm",
												variant: "outline",
												onClick: () =>
													t("estimate-detail", {
														id: u.service_estimate,
													}),
												children: [
													(0, i.jsx)(N.A, { className: "h-4 w-4 mr-2" }),
													"View service estimate",
												],
											}),
										O &&
											u.job_card &&
											(0, i.jsxs)(l.$, {
												size: "sm",
												variant: "outline",
												onClick: () =>
													t("job-card-detail", { id: u.job_card }),
												children: [
													(0, i.jsx)(b.A, { className: "h-4 w-4 mr-2" }),
													"View Job Card",
												],
											}),
									],
								}),
							],
						}),
						(0, i.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
							children: [
								(0, i.jsx)(c.Zp, {
									className: "dms-kpi-card",
									children: (0, i.jsx)(c.Wu, {
										className: "px-3.5 py-3",
										children: (0, i.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, i.jsx)("div", {
													className: "p-2 rounded-full bg-primary/10",
													children: (0, i.jsx)(y.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, i.jsxs)("div", {
													children: [
														(0, i.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "Odometer",
														}),
														(0, i.jsxs)("p", {
															className: "text-lg font-semibold",
															children: [
																u.odometer_reading?.toLocaleString() ||
																	"N/A",
																" km",
															],
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, i.jsx)(c.Zp, {
									className: "dms-kpi-card",
									children: (0, i.jsx)(c.Wu, {
										className: "px-3.5 py-3",
										children: (0, i.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, i.jsx)("div", {
													className: "p-2 rounded-full bg-primary/10",
													children: (0, i.jsx)(_.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, i.jsxs)("div", {
													children: [
														(0, i.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "Fuel Level",
														}),
														(0, i.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [
																(0, i.jsx)("div", {
																	className:
																		"w-16 h-2 bg-muted rounded-full overflow-hidden",
																	children: (0, i.jsx)("div", {
																		className:
																			"h-full bg-primary rounded-full",
																		style: { width: `${V}%` },
																	}),
																}),
																(0, i.jsxs)("span", {
																	className:
																		"text-sm font-medium",
																	children: [V, "%"],
																}),
															],
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, i.jsx)(c.Zp, {
									className: "dms-kpi-card",
									children: (0, i.jsx)(c.Wu, {
										className: "px-3.5 py-3",
										children: (0, i.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, i.jsx)("div", {
													className: "p-2 rounded-full bg-primary/10",
													children: (0, i.jsx)(w.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, i.jsxs)("div", {
													children: [
														(0, i.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "Inspector",
														}),
														(0, i.jsx)("p", {
															className:
																"text-lg font-semibold truncate",
															children: u.inspected_by || "N/A",
														}),
													],
												}),
											],
										}),
									}),
								}),
								(0, i.jsx)(c.Zp, {
									className: "dms-kpi-card",
									children: (0, i.jsx)(c.Wu, {
										className: "px-3.5 py-3",
										children: (0, i.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [
												(0, i.jsx)("div", {
													className: "p-2 rounded-full bg-primary/10",
													children: (0, i.jsx)(A.A, {
														className: "h-3.5 w-3.5 text-primary",
													}),
												}),
												(0, i.jsxs)("div", {
													children: [
														(0, i.jsx)("p", {
															className:
																"text-sm text-muted-foreground",
															children: "Inspection Date",
														}),
														(0, i.jsx)("p", {
															className: "text-lg font-semibold",
															children: u.inspection_date
																? (0, a.Yq)(u.inspection_date)
																: "N/A",
														}),
													],
												}),
											],
										}),
									}),
								}),
							],
						}),
						(0, i.jsxs)(x.tU, {
							value: T,
							onValueChange: I,
							children: [
								(0, i.jsxs)(x.j7, {
									className: "bg-muted/50",
									children: [
										(0, i.jsx)(x.Xi, {
											value: "overview",
											children: "Overview",
										}),
										(0, i.jsx)(x.Xi, {
											value: "exterior",
											children: "Exterior",
										}),
										(0, i.jsx)(x.Xi, {
											value: "interior",
											children: "Interior",
										}),
										(0, i.jsx)(x.Xi, {
											value: "tires",
											children: "Tires & Wheels",
										}),
										(0, i.jsx)(x.Xi, {
											value: "warnings",
											children: "Warning Lights",
										}),
									],
								}),
								(0, i.jsx)(x.av, {
									value: "overview",
									className: "mt-6",
									children: (0, i.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-6",
										children: [
											(0, i.jsxs)(c.Zp, {
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsxs)(c.ZB, {
															className: "flex items-center gap-2",
															children: [
																(0, i.jsx)(k.A, {
																	className: "h-5 w-5",
																}),
																"Vehicle Information",
															],
														}),
													}),
													(0, i.jsx)(c.Wu, {
														className: "space-y-4",
														children: (0, i.jsxs)("div", {
															className: "grid grid-cols-2 gap-4",
															children: [
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children:
																				"Registration",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				u.vehicle_registration,
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "Model",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				u.vehicle_model,
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "VIN",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium font-mono text-sm",
																			children:
																				u.vin_number ||
																				"N/A",
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "Color",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				u.vehicle_color ||
																				"N/A",
																		}),
																	],
																}),
															],
														}),
													}),
												],
											}),
											(0, i.jsxs)(c.Zp, {
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsxs)(c.ZB, {
															className: "flex items-center gap-2",
															children: [
																(0, i.jsx)(w.A, {
																	className: "h-5 w-5",
																}),
																"Customer Information",
															],
														}),
													}),
													(0, i.jsx)(c.Wu, {
														className: "space-y-4",
														children: (0, i.jsxs)("div", {
															className: "grid grid-cols-2 gap-4",
															children: [
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children:
																				"Customer Name",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				u.customer_name ||
																				u.customer,
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "Contact",
																		}),
																		(0, i.jsx)("p", {
																			className:
																				"font-medium",
																			children:
																				u.contact_number ||
																				"N/A",
																		}),
																	],
																}),
																(u.company || u.company_name) &&
																	(0, i.jsxs)("div", {
																		children: [
																			(0, i.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"Company",
																			}),
																			(0, i.jsx)("p", {
																				className:
																					"font-medium",
																				children:
																					u.company_name ||
																					u.company,
																			}),
																		],
																	}),
															],
														}),
													}),
												],
											}),
											(0, i.jsxs)(c.Zp, {
												className: "md:col-span-2",
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsx)(c.ZB, {
															children: "Customer Remarks",
														}),
													}),
													(0, i.jsx)(c.Wu, {
														children: (0, i.jsx)("p", {
															className: "text-muted-foreground",
															children:
																u.customer_remarks ||
																"No remarks provided",
														}),
													}),
												],
											}),
											u.items_in_vehicle &&
												u.items_in_vehicle.length > 0 &&
												(0, i.jsxs)(c.Zp, {
													className: "md:col-span-2",
													children: [
														(0, i.jsx)(c.aR, {
															children: (0, i.jsx)(c.ZB, {
																children: "Items in Vehicle",
															}),
														}),
														(0, i.jsx)(c.Wu, {
															children: (0, i.jsx)("div", {
																className: "flex flex-wrap gap-2",
																children: u.items_in_vehicle.map(
																	(e, t) =>
																		(0, i.jsxs)(
																			o.E,
																			{
																				variant: "outline",
																				children: [
																					e.item_name,
																					e.quantity &&
																						e.quantity >
																							1 &&
																						` (${e.quantity})`,
																				],
																			},
																			t
																		)
																),
															}),
														}),
													],
												}),
										],
									}),
								}),
								(0, i.jsx)(x.av, {
									value: "exterior",
									className: "mt-6",
									children: (0, i.jsxs)(c.Zp, {
										children: [
											(0, i.jsx)(c.aR, {
												children: (0, i.jsx)(c.ZB, {
													children: "Exterior Inspection",
												}),
											}),
											(0, i.jsx)(c.Wu, {
												children: (0, i.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, i.jsx)(F, {
															label: "Body Condition",
															condition: u.body_condition || "N/A",
															notes: u.body_damage_notes,
														}),
														(0, i.jsx)(F, {
															label: "Paint Condition",
															condition: u.paint_condition || "N/A",
															notes: u.paint_damage_notes,
														}),
														(0, i.jsx)(F, {
															label: "Windshield",
															condition:
																u.windshield_condition || "N/A",
															notes: u.windshield_notes,
														}),
														(0, i.jsx)(F, {
															label: "Headlights",
															condition:
																u.headlights_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Tail Lights",
															condition:
																u.taillights_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Side Mirrors",
															condition:
																u.side_mirrors_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Wipers",
															condition: u.wipers_condition || "N/A",
														}),
													],
												}),
											}),
										],
									}),
								}),
								(0, i.jsx)(x.av, {
									value: "interior",
									className: "mt-6",
									children: (0, i.jsxs)(c.Zp, {
										children: [
											(0, i.jsx)(c.aR, {
												children: (0, i.jsx)(c.ZB, {
													children: "Interior Inspection",
												}),
											}),
											(0, i.jsx)(c.Wu, {
												children: (0, i.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, i.jsx)(F, {
															label: "Dashboard",
															condition:
																u.dashboard_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Seats",
															condition: u.seats_condition || "N/A",
															notes: u.seats_notes,
														}),
														(0, i.jsx)(F, {
															label: "Upholstery",
															condition:
																u.upholstery_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Floor Mats",
															condition:
																u.floor_mats_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "AC/Ventilation",
															condition:
																u.ac_ventilation_condition ||
																"N/A",
														}),
														(0, i.jsx)(F, {
															label: "Audio System",
															condition:
																u.audio_system_condition || "N/A",
														}),
														(0, i.jsx)(F, {
															label: "Steering Wheel",
															condition:
																u.steering_wheel_condition ||
																"N/A",
														}),
													],
												}),
											}),
										],
									}),
								}),
								(0, i.jsx)(x.av, {
									value: "tires",
									className: "mt-6",
									children: (0, i.jsxs)("div", {
										className: "grid md:grid-cols-2 gap-6",
										children: [
											(0, i.jsxs)(c.Zp, {
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsx)(c.ZB, {
															children: "Front Tires",
														}),
													}),
													(0, i.jsxs)(c.Wu, {
														children: [
															(0, i.jsxs)("div", {
																className: "space-y-1",
																children: [
																	(0, i.jsx)(F, {
																		label: "Front Left Tire",
																		condition:
																			u.front_left_tire_condition ||
																			"N/A",
																	}),
																	(0, i.jsx)(F, {
																		label: "Front Right Tire",
																		condition:
																			u.front_right_tire_condition ||
																			"N/A",
																	}),
																],
															}),
															(0, i.jsx)(m.w, { className: "my-4" }),
															(0, i.jsxs)("div", {
																className:
																	"grid grid-cols-2 gap-4",
																children: [
																	(0, i.jsxs)("div", {
																		children: [
																			(0, i.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"FL Tread Depth",
																			}),
																			(0, i.jsxs)("p", {
																				className:
																					"font-medium",
																				children: [
																					u.front_left_tread_depth ||
																						"N/A",
																					" mm",
																				],
																			}),
																		],
																	}),
																	(0, i.jsxs)("div", {
																		children: [
																			(0, i.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"FR Tread Depth",
																			}),
																			(0, i.jsxs)("p", {
																				className:
																					"font-medium",
																				children: [
																					u.front_right_tread_depth ||
																						"N/A",
																					" mm",
																				],
																			}),
																		],
																	}),
																],
															}),
														],
													}),
												],
											}),
											(0, i.jsxs)(c.Zp, {
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsx)(c.ZB, {
															children: "Rear Tires",
														}),
													}),
													(0, i.jsxs)(c.Wu, {
														children: [
															(0, i.jsxs)("div", {
																className: "space-y-1",
																children: [
																	(0, i.jsx)(F, {
																		label: "Rear Left Tire",
																		condition:
																			u.rear_left_tire_condition ||
																			"N/A",
																	}),
																	(0, i.jsx)(F, {
																		label: "Rear Right Tire",
																		condition:
																			u.rear_right_tire_condition ||
																			"N/A",
																	}),
																],
															}),
															(0, i.jsx)(m.w, { className: "my-4" }),
															(0, i.jsxs)("div", {
																className:
																	"grid grid-cols-2 gap-4",
																children: [
																	(0, i.jsxs)("div", {
																		children: [
																			(0, i.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"RL Tread Depth",
																			}),
																			(0, i.jsxs)("p", {
																				className:
																					"font-medium",
																				children: [
																					u.rear_left_tread_depth ||
																						"N/A",
																					" mm",
																				],
																			}),
																		],
																	}),
																	(0, i.jsxs)("div", {
																		children: [
																			(0, i.jsx)("p", {
																				className:
																					"text-sm text-muted-foreground",
																				children:
																					"RR Tread Depth",
																			}),
																			(0, i.jsxs)("p", {
																				className:
																					"font-medium",
																				children: [
																					u.rear_right_tread_depth ||
																						"N/A",
																					" mm",
																				],
																			}),
																		],
																	}),
																],
															}),
														],
													}),
												],
											}),
											(0, i.jsxs)(c.Zp, {
												className: "md:col-span-2",
												children: [
													(0, i.jsx)(c.aR, {
														children: (0, i.jsx)(c.ZB, {
															children: "Spare Tire & Wheels",
														}),
													}),
													(0, i.jsx)(c.Wu, {
														children: (0, i.jsxs)("div", {
															className: "grid md:grid-cols-3 gap-4",
															children: [
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "Spare Tire",
																		}),
																		(0, i.jsx)(W, {
																			condition:
																				u.spare_tire_condition ||
																				"N/A",
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children:
																				"Wheel Condition",
																		}),
																		(0, i.jsx)(W, {
																			condition:
																				u.wheel_condition ||
																				"N/A",
																		}),
																	],
																}),
																(0, i.jsxs)("div", {
																	children: [
																		(0, i.jsx)("p", {
																			className:
																				"text-sm text-muted-foreground",
																			children: "Hubcaps",
																		}),
																		(0, i.jsx)(W, {
																			condition:
																				u.hubcaps_condition ||
																				"N/A",
																		}),
																	],
																}),
															],
														}),
													}),
												],
											}),
										],
									}),
								}),
								(0, i.jsx)(x.av, {
									value: "warnings",
									className: "mt-6",
									children: (0, i.jsxs)(c.Zp, {
										children: [
											(0, i.jsx)(c.aR, {
												children: (0, i.jsxs)(c.ZB, {
													className: "flex items-center gap-2",
													children: [
														(0, i.jsx)(g.A, { className: "h-5 w-5" }),
														"Warning Lights Status",
													],
												}),
											}),
											(0, i.jsx)(c.Wu, {
												children:
													u.warning_lights && u.warning_lights.length > 0
														? (0, i.jsx)("div", {
																className:
																	"grid md:grid-cols-2 lg:grid-cols-3 gap-4",
																children: u.warning_lights.map(
																	(e, t) =>
																		(0, i.jsxs)(
																			"div",
																			{
																				className: `p-4 rounded-lg border ${
																					e.is_on
																						? "border-destructive/50 bg-destructive/5"
																						: "border-border bg-muted/30"
																				}`,
																				children: [
																					(0, i.jsxs)(
																						"div",
																						{
																							className:
																								"flex items-center justify-between",
																							children:
																								[
																									(0,
																									i.jsx)(
																										"span",
																										{
																											className:
																												"font-medium",
																											children:
																												e.warning_light_name,
																										}
																									),
																									e.is_on
																										? (0,
																										  i.jsx)(
																												o.E,
																												{
																													variant:
																														"destructive",
																													children:
																														"ON",
																												}
																										  )
																										: (0,
																										  i.jsx)(
																												o.E,
																												{
																													variant:
																														"outline",
																													children:
																														"OFF",
																												}
																										  ),
																								],
																						}
																					),
																					e.notes &&
																						(0, i.jsx)(
																							"p",
																							{
																								className:
																									"text-sm text-muted-foreground mt-2",
																								children:
																									e.notes,
																							}
																						),
																				],
																			},
																			t
																		)
																),
														  })
														: (0, i.jsx)("p", {
																className: "text-muted-foreground",
																children:
																	"No warning lights recorded",
														  }),
											}),
										],
									}),
								}),
							],
						}),
						(u.customer_signature || u.inspector_signature) &&
							(0, i.jsxs)(c.Zp, {
								children: [
									(0, i.jsx)(c.aR, {
										children: (0, i.jsx)(c.ZB, { children: "Signatures" }),
									}),
									(0, i.jsx)(c.Wu, {
										children: (0, i.jsxs)("div", {
											className: "grid md:grid-cols-2 gap-6",
											children: [
												u.customer_signature &&
													(0, i.jsxs)("div", {
														children: [
															(0, i.jsx)("p", {
																className:
																	"text-sm text-muted-foreground mb-2",
																children: "Customer Signature",
															}),
															(0, i.jsx)("div", {
																className:
																	"border rounded-lg p-4 bg-muted/30",
																children: (0, i.jsx)("img", {
																	src: u.customer_signature,
																	alt: "Customer Signature",
																	className: "max-h-24 mx-auto",
																}),
															}),
														],
													}),
												u.inspector_signature &&
													(0, i.jsxs)("div", {
														children: [
															(0, i.jsx)("p", {
																className:
																	"text-sm text-muted-foreground mb-2",
																children: "Inspector Signature",
															}),
															(0, i.jsx)("div", {
																className:
																	"border rounded-lg p-4 bg-muted/30",
																children: (0, i.jsx)("img", {
																	src: u.inspector_signature,
																	alt: "Inspector Signature",
																	className: "max-h-24 mx-auto",
																}),
															}),
														],
													}),
											],
										}),
									}),
								],
							}),
					],
				});
			}
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => l });
			var i = s(95155);
			s(12115);
			var a = s(42442),
				r = s(18460),
				n = s(91337);
			let d = (0, r.F)(
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
				let c = s ? a.DX : "span";
				return (0, i.jsx)(c, {
					"data-slot": "badge",
					className: (0, n.cn)(d({ variant: t }), e),
					...r,
				});
			}
		},
		42869: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("user", [
				["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
				["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
			]);
		},
		43447: (e, t, s) => {
			s.d(t, {
				SQ: () => l,
				_2: () => c,
				lp: () => o,
				mB: () => m,
				rI: () => n,
				ty: () => d,
			});
			var i = s(95155);
			s(12115);
			var a = s(61108),
				r = s(91337);
			function n({ ...e }) {
				return (0, i.jsx)(a.bL, { "data-slot": "dropdown-menu", ...e });
			}
			function d({ ...e }) {
				return (0, i.jsx)(a.l9, { "data-slot": "dropdown-menu-trigger", ...e });
			}
			function l({ className: e, sideOffset: t = 4, ...s }) {
				return (0, i.jsx)(a.ZL, {
					children: (0, i.jsx)(a.UC, {
						"data-slot": "dropdown-menu-content",
						sideOffset: t,
						className: (0, r.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
							e
						),
						...s,
					}),
				});
			}
			function c({ className: e, inset: t, variant: s = "default", ...n }) {
				return (0, i.jsx)(a.q7, {
					"data-slot": "dropdown-menu-item",
					"data-inset": t,
					"data-variant": s,
					className: (0, r.cn)(
						"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...n,
				});
			}
			function o({ className: e, inset: t, ...s }) {
				return (0, i.jsx)(a.JU, {
					"data-slot": "dropdown-menu-label",
					"data-inset": t,
					className: (0, r.cn)("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", e),
					...s,
				});
			}
			function m({ className: e, ...t }) {
				return (0, i.jsx)(a.wv, {
					"data-slot": "dropdown-menu-separator",
					className: (0, r.cn)("bg-border -mx-1 my-1 h-px", e),
					...t,
				});
			}
		},
		48368: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("file-text", [
				[
					"path",
					{
						d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
						key: "1oefj6",
					},
				],
				["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
				["path", { d: "M10 9H8", key: "b1mrlr" }],
				["path", { d: "M16 13H8", key: "t4e002" }],
				["path", { d: "M16 17H8", key: "z1uh3a" }],
			]);
		},
		49387: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		49580: (e, t, s) => {
			s.d(t, { e: () => c });
			var i = s(95155),
				a = s(12115),
				r = s(81262),
				n = s(5240),
				d = s(4474),
				l = s(43447);
			function c({
				doctype: e,
				docName: t,
				noLetterhead: s = 0,
				triggerPrint: o = 0,
				className: m,
				variant: x = "default",
			}) {
				let [u, h] = (0, a.useState)(null),
					[p, g] = (0, a.useState)(!1),
					[j, f] = (0, a.useState)(!1);
				(0, a.useEffect)(() => {
					if (!e) return void h(["Standard"]);
					let t = !1;
					return (
						(0, n.Iy)(e)
							.then((e) => {
								t || h(e.length ? e : ["Standard"]);
							})
							.catch(() => {
								t || h(["Standard"]);
							}),
						() => {
							t = !0;
						}
					);
				}, [e]);
				let v = (i) => {
						e &&
							t &&
							(function (e, t, s = "Standard", i) {
								let a = new URLSearchParams();
								a.set("doctype", e),
									a.set("name", t),
									a.set("format", s),
									a.set("trigger_print", String(i?.triggerPrint ?? 0)),
									a.set("no_letterhead", String(i?.noLetterhead ?? 0));
								let r = window.location.origin;
								window.open(
									`${r}/printview?${a.toString()}`,
									"_blank",
									"noopener,noreferrer"
								);
							})(e, t, i, { noLetterhead: s, triggerPrint: o });
					},
					N = async (s) => {
						if ((s.stopPropagation(), s.preventDefault(), !j && e && t)) {
							f(!0);
							try {
								let t = u;
								if (!t) {
									let s = await (0, n.Iy)(e);
									(t = s.length ? s : ["Standard"]), h(t);
								}
								if (t.length <= 1) return void v(t[0] || "Standard");
								g(!0);
							} catch {
								v("Standard");
							} finally {
								f(!1);
							}
						}
					},
					b = "icon" === x,
					y = {
						type: "button",
						variant: b ? "ghost" : "outline",
						size: b ? "icon" : "sm",
						className: m,
						"aria-label": "Print",
						title: "Print",
						disabled: j,
					};
				return u && u.length > 1
					? (0, i.jsxs)(l.rI, {
							open: p,
							onOpenChange: g,
							children: [
								(0, i.jsx)(l.ty, {
									asChild: !0,
									children: (0, i.jsxs)(d.$, {
										...y,
										onClick: (e) => e.stopPropagation(),
										children: [
											(0, i.jsx)(r.A, {
												className: b ? "h-4 w-4" : "h-4 w-4 mr-2",
											}),
											!b && "Print",
										],
									}),
								}),
								(0, i.jsxs)(l.SQ, {
									align: "end",
									side: "bottom",
									sideOffset: 4,
									collisionPadding: 8,
									className: "min-w-[180px] z-[9999]",
									onClick: (e) => e.stopPropagation(),
									children: [
										(0, i.jsx)(l.lp, {
											className: "text-xs font-medium text-muted-foreground",
											children: "Print format",
										}),
										(0, i.jsx)(l.mB, {}),
										u.map((e) =>
											(0, i.jsx)(
												l._2,
												{
													onSelect: () => {
														v(e), g(!1);
													},
													children: e,
												},
												e
											)
										),
									],
								}),
							],
					  })
					: (0, i.jsxs)(d.$, {
							...y,
							onClick: N,
							children: [
								(0, i.jsx)(r.A, { className: b ? "h-4 w-4" : "h-4 w-4 mr-2" }),
								!b && "Print",
							],
					  });
			}
		},
		57420: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("calendar", [
				["path", { d: "M8 2v4", key: "1cmpym" }],
				["path", { d: "M16 2v4", key: "4m81vk" }],
				["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
				["path", { d: "M3 10h18", key: "8toen8" }],
			]);
		},
		61991: (e, t, s) => {
			s.d(t, { w: () => n });
			var i = s(95155);
			s(12115);
			var a = s(89803),
				r = s(91337);
			function n({ className: e, orientation: t = "horizontal", decorative: s = !0, ...d }) {
				return (0, i.jsx)(a.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: t,
					className: (0, r.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...d,
				});
			}
		},
		62791: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("circle-x", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m15 9-6 6", key: "1uzhvr" }],
				["path", { d: "m9 9 6 6", key: "z0biqf" }],
			]);
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => l, Wu: () => c, ZB: () => d, Zp: () => r, aR: () => n });
			var i = s(95155);
			s(12115);
			var a = s(91337);
			function r({ className: e, ...t }) {
				return (0, i.jsx)("div", {
					"data-slot": "card",
					className: (0, a.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function n({ className: e, ...t }) {
				return (0, i.jsx)("div", {
					"data-slot": "card-header",
					className: (0, a.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, i.jsx)("div", {
					"data-slot": "card-title",
					className: (0, a.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, i.jsx)("div", {
					"data-slot": "card-description",
					className: (0, a.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, i.jsx)("div", {
					"data-slot": "card-content",
					className: (0, a.cn)("px-4", e),
					...t,
				});
			}
		},
		80723: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("arrow-left", [
				["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
				["path", { d: "M19 12H5", key: "x3x0zl" }],
			]);
		},
		81672: (e, t, s) => {
			s.d(t, { Ge: () => m, N0: () => c, Yq: () => d, gQ: () => o, r6: () => l });
			let i = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				a = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				r = (e) => String(e).padStart(2, "0");
			function n(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let s = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (s) return new Date(Number(s[1]), Number(s[2]) - 1, Number(s[3]));
				let i = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(i.getTime()) ? null : i;
			}
			function d(e, t = "") {
				let s = n(e);
				return s ? `${r(s.getDate())}/${r(s.getMonth() + 1)}/${s.getFullYear()}` : t;
			}
			function l(e, t = "", s = !1) {
				let i = n(e);
				if (!i) return t;
				let a = `${r(i.getHours())}:${r(i.getMinutes())}${
					s ? `:${r(i.getSeconds())}` : ""
				}`;
				return `${d(i)} ${a}`;
			}
			function c(e, t = "") {
				let s = n(e);
				return s ? `${i[s.getMonth()]} ${s.getFullYear()}` : t;
			}
			function o(e, t = "") {
				let s = n(e);
				return s ? a[s.getDay()] : t;
			}
			function m(e, t = "") {
				let s = n(e);
				return s ? `${a[s.getDay()]}, ${d(s)}` : t;
			}
		},
		93053: (e, t, s) => {
			s.d(t, { A: () => i });
			let i = (0, s(90425).A)("clipboard-check", [
				[
					"rect",
					{ width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" },
				],
				[
					"path",
					{
						d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
						key: "116196",
					},
				],
				["path", { d: "m9 14 2 2 4-4", key: "df797q" }],
			]);
		},
	},
]);
