--!strict
local HttpService = game:GetService("HttpService")
local ReportExportConfig = require(script.Parent.ReportExportConfig)

export type ReportExportPayload = {
	attempt_id: string,
	roblox_username: string,
	roblox_user_id: number?,
	attack_type: string,
	source: string,
	taken_actions: { string },
	content: string,
	hints_used: number,
	outcome: string,
	training_id: string?,
	training_name: string?,
}

export type ReportExportAck = {
	ok: boolean,
	report_id: string,
	child_name: string,
	parent_name: string,
	state: string,
	matched: boolean,
}

export type ExportStatusCallback = (status: "sending" | "sent" | "failed", ack: ReportExportAck?) -> ()

local ReportExportService = {}

local RETRY_DELAYS = { 0, 1, 3 }

local function sendOnce(
	payloadJson: string,
	config: ReportExportConfig.ExportConfig
): (boolean, ReportExportAck?, boolean?)
	local endpoint = config.baseUrl .. "/api/reports/ingest"
	local requestOptions = {
		Url = endpoint,
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
			["x-ingest-secret"] = config.ingestSecret,
		},
		Body = payloadJson,
	}

	local httpOk, response = pcall(function()
		return HttpService:RequestAsync(requestOptions)
	end)

	if not httpOk then
		warn("[ReportExportService] Transport error: " .. tostring(response))
		warn("[ReportExportService] Tip: Check if 'Allow HTTP Requests' is enabled in Game Settings -> Security")
		-- Transport / network error: retryable
		return false, nil, true
	end

	local statusCode = response.StatusCode
	if statusCode >= 500 and statusCode <= 599 then
		warn("[ReportExportService] Server error " .. tostring(statusCode) .. ": " .. tostring(response.Body))
		-- Server 5xx error: retryable
		return false, nil, true
	end

	if statusCode >= 200 and statusCode <= 299 then
		local decodeOk, decoded = pcall(function()
			return HttpService:JSONDecode(response.Body)
		end)
		if
			decodeOk
			and typeof(decoded) == "table"
			and decoded.ok == true
			and typeof(decoded.report_id) == "string"
			and typeof(decoded.child_name) == "string"
			and typeof(decoded.parent_name) == "string"
			and typeof(decoded.state) == "string"
			and typeof(decoded.matched) == "boolean"
		then
			local ack: ReportExportAck = {
				ok = true,
				report_id = decoded.report_id,
				child_name = decoded.child_name,
				parent_name = decoded.parent_name,
				state = decoded.state,
				matched = decoded.matched,
			}
			print(
				"[ReportExportService] Ingest succeeded! Report ID: "
					.. ack.report_id
					.. ", recipient: "
					.. ack.parent_name
			)
			return true, ack, false
		else
			warn("[ReportExportService] Decode error or unexpected JSON shape: " .. tostring(response.Body))
		end
	else
		warn("[ReportExportService] HTTP error " .. tostring(statusCode) .. ": " .. tostring(response.Body))
	end

	-- 4xx or decode error: non-retryable
	return false, nil, false
end

function ReportExportService.exportAttemptAsync(
	payload: ReportExportPayload,
	config: ReportExportConfig.ExportConfig,
	onStatus: ExportStatusCallback
): ReportExportAck?
	onStatus("sending", nil)

	local jsonOk, payloadJson = pcall(function()
		return HttpService:JSONEncode(payload)
	end)
	if not jsonOk or typeof(payloadJson) ~= "string" then
		onStatus("failed", nil)
		return nil
	end

	for _, delaySeconds in ipairs(RETRY_DELAYS) do
		if delaySeconds > 0 then
			task.wait(delaySeconds)
		end

		local success, ack, shouldRetry = sendOnce(payloadJson, config)
		if success and ack then
			onStatus("sent", ack)
			return ack
		end

		if not shouldRetry then
			break
		end
	end

	onStatus("failed", nil)
	return nil
end

return ReportExportService
