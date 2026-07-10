Statistics = {}

function Statistics.GetCompanyStats(jobId)
    local row = MySQL.single.await('SELECT * FROM alc_company_stats WHERE job_id = ?', { jobId })
    if row then return row end
    return { job_id = jobId, total_revenue = 0, total_orders = 0, total_km = 0, success_rate = 100 }
end

function Statistics.GetAllCompanyStats()
    local rows = MySQL.query.await([[
        SELECT cs.*, j.name as job_name FROM alc_company_stats cs
        JOIN alc_jobs j ON j.id = cs.job_id ORDER BY cs.total_revenue DESC
    ]]) or {}
    if #rows == 0 then
        local jobs = Database.GetJobs()
        for _, j in ipairs(jobs) do
            rows[#rows + 1] = {
                job_id = j.id,
                job_name = j.name,
                total_revenue = 0,
                total_orders = 0,
                total_km = 0,
                success_rate = 100,
            }
        end
    end
    return rows
end

function Statistics.GetTopDrivers(jobId, limit)
    limit = limit or 10
    if jobId then
        return MySQL.query.await([[
            SELECT * FROM alc_driver_stats WHERE job_id = ?
            ORDER BY total_earnings DESC, completed_orders DESC LIMIT ?
        ]], { jobId, limit }) or {}
    end
    return MySQL.query.await([[
        SELECT * FROM alc_driver_stats
        ORDER BY total_earnings DESC, completed_orders DESC LIMIT ?
    ]], { limit }) or {}
end

function Statistics.GetDriverStats(identifier, jobId)
    local row = MySQL.single.await(
        'SELECT * FROM alc_driver_stats WHERE identifier = ? AND job_id = ?',
        { identifier, jobId }
    )
    return row or {
        completed_orders = 0, km_driven = 0, total_earnings = 0,
        deliveries_today = 0, success_count = 0, fail_count = 0, driver_level = 1,
    }
end

function Statistics.GetGlobalStats()
    local totals = MySQL.single.await([[
        SELECT
            COALESCE(SUM(completed_orders), 0) as completed_orders,
            COALESCE(SUM(km_driven), 0) as km_driven,
            COALESCE(SUM(total_earnings), 0) as total_earnings,
            COALESCE(SUM(deliveries_today), 0) as deliveries_today,
            COALESCE(SUM(success_count), 0) as success_count,
            COALESCE(SUM(fail_count), 0) as fail_count
        FROM alc_driver_stats
    ]]) or {}

    local successTotal = (totals.success_count or 0) + (totals.fail_count or 0)
    totals.success_rate = successTotal > 0
        and math.floor((totals.success_count / successTotal) * 1000) / 10
        or 100

    totals.company_revenue = MySQL.scalar.await('SELECT COALESCE(SUM(total_revenue), 0) FROM alc_company_stats') or 0
    totals.top_drivers = Statistics.GetTopDrivers(nil, 5)
    totals.company_stats = Statistics.GetAllCompanyStats()

    return totals
end

function Statistics.RecordDelivery(jobId, identifier, playerName, orderId, earnings, distanceKm, success)
    local today = os.date('%Y-%m-%d')
    local status = success and 'completed' or 'failed'

    MySQL.insert.await([[
        INSERT INTO alc_order_history (job_id, order_id, identifier, player_name, status, earnings, distance_km)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], { jobId, orderId, identifier, playerName, status, earnings or 0, distanceKm or 0 })

    local driver = Statistics.GetDriverStats(identifier, jobId)
    local deliveriesToday = driver.deliveries_today or 0

    if success then
        MySQL.update.await([[
            INSERT INTO alc_driver_stats (job_id, identifier, player_name, completed_orders, km_driven, total_earnings, deliveries_today, success_count)
            VALUES (?, ?, ?, 1, ?, ?, 1, 1)
            ON DUPLICATE KEY UPDATE
                player_name = VALUES(player_name),
                completed_orders = completed_orders + 1,
                km_driven = km_driven + VALUES(km_driven),
                total_earnings = total_earnings + VALUES(total_earnings),
                deliveries_today = ?,
                success_count = success_count + 1
        ]], { jobId, identifier, playerName, distanceKm or 0, earnings or 0, deliveriesToday + 1 })
    else
        MySQL.update.await([[
            INSERT INTO alc_driver_stats (job_id, identifier, player_name, fail_count)
            VALUES (?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE fail_count = fail_count + 1, player_name = VALUES(player_name)
        ]], { jobId, identifier, playerName })
    end

    if success then
        MySQL.update.await([[
            INSERT INTO alc_company_stats (job_id, total_revenue, total_orders, total_km)
            VALUES (?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE
                total_revenue = total_revenue + VALUES(total_revenue),
                total_orders = total_orders + 1,
                total_km = total_km + VALUES(total_km)
        ]], { jobId, earnings or 0, distanceKm or 0 })
    end

    Statistics.RefreshSuccessRate(jobId)
end

function Statistics.RefreshSuccessRate(jobId)
    local stats = MySQL.single.await([[
        SELECT COALESCE(SUM(success_count), 0) as s, COALESCE(SUM(fail_count), 0) as f
        FROM alc_driver_stats WHERE job_id = ?
    ]], { jobId })
    if not stats then return end
    local total = stats.s + stats.f
    local rate = total > 0 and (stats.s / total) * 100 or 100
    MySQL.update.await([[
        INSERT INTO alc_company_stats (job_id, success_rate) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE success_rate = ?
    ]], { jobId, rate, rate })
end

lib.callback.register('alc:server:getStatistics', function(source)
    if not Database.IsAdmin(source) then return nil end
    return Statistics.GetGlobalStats()
end)

exports('RecordDelivery', function(jobId, identifier, playerName, orderId, earnings, distanceKm, success)
    Statistics.RecordDelivery(jobId, identifier, playerName, orderId, earnings, distanceKm, success ~= false)
end)

exports('GetTopDrivers', function(jobId, limit)
    return Statistics.GetTopDrivers(jobId, limit)
end)

exports('GetCompanyStats', function(jobId)
    return Statistics.GetCompanyStats(jobId)
end)
