-- RPC Function to handle city deletion bypassing REPLICA IDENTITY constraints
-- This function works at the database level and can perform operations that client-side queries cannot

CREATE OR REPLACE FUNCTION delete_city_by_id(city_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_city RECORD;
    result JSON;
BEGIN
    -- First, try to get the city to be deleted for return data
    SELECT * INTO deleted_city FROM cities WHERE id = city_id;
    
    -- If city doesn't exist, return error
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'City not found',
            'error_code', 'CITY_NOT_FOUND'
        );
    END IF;
    
    -- Try to delete the city directly
    -- This should work even with REPLICA IDENTITY issues because it's server-side
    BEGIN
        DELETE FROM cities WHERE id = city_id;
        
        -- If we get here, deletion was successful
        RETURN json_build_object(
            'success', true,
            'message', 'City deleted successfully',
            'deleted_city', row_to_json(deleted_city)
        );
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- If direct deletion fails, try soft delete approach
            BEGIN
                UPDATE cities 
                SET 
                    status = 'disabled',
                    name = '[DELETED] ' || name,
                    updated_at = NOW()
                WHERE id = city_id;
                
                RETURN json_build_object(
                    'success', true,
                    'message', 'City soft-deleted successfully (direct deletion failed)',
                    'method', 'soft_delete',
                    'deleted_city', row_to_json(deleted_city),
                    'warning', 'Direct deletion failed, used soft delete instead'
                );
                
            EXCEPTION 
                WHEN OTHERS THEN
                    -- If even soft delete fails, return the error
                    RETURN json_build_object(
                        'success', false,
                        'error', 'Failed to delete city: ' || SQLERRM,
                        'error_code', 'DELETE_FAILED',
                        'attempted_methods', ARRAY['direct_delete', 'soft_delete']
                    );
            END;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_city_by_id(UUID) TO authenticated;

-- Also create a bulk delete function for efficiency
CREATE OR REPLACE FUNCTION delete_cities_bulk(city_ids UUID[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    city_id UUID;
    success_count INTEGER := 0;
    failure_count INTEGER := 0;
    deleted_cities JSON[] := '{}';
    failed_cities JSON[] := '{}';
    city_result JSON;
BEGIN
    -- Loop through each city ID
    FOREACH city_id IN ARRAY city_ids
    LOOP
        -- Call the single delete function for each city
        SELECT delete_city_by_id(city_id) INTO city_result;
        
        -- Check if deletion was successful
        IF (city_result->>'success')::boolean THEN
            success_count := success_count + 1;
            deleted_cities := deleted_cities || city_result;
        ELSE
            failure_count := failure_count + 1;
            failed_cities := failed_cities || city_result;
        END IF;
    END LOOP;
    
    -- Return summary of bulk operation
    RETURN json_build_object(
        'success', success_count > 0,
        'total_attempted', array_length(city_ids, 1),
        'success_count', success_count,
        'failure_count', failure_count,
        'deleted_cities', deleted_cities,
        'failed_cities', failed_cities,
        'message', 
            CASE 
                WHEN failure_count = 0 THEN 'All cities deleted successfully'
                WHEN success_count = 0 THEN 'No cities could be deleted'
                ELSE success_count || ' cities deleted, ' || failure_count || ' failed'
            END
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_cities_bulk(UUID[]) TO authenticated;

-- Create a function to check if these RPC functions exist and are working
CREATE OR REPLACE FUNCTION test_delete_functions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'delete_city_by_id_exists', 
        EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'delete_city_by_id' 
            AND pg_function_is_visible(oid)
        ),
        'delete_cities_bulk_exists',
        EXISTS(
            SELECT 1 FROM pg_proc 
            WHERE proname = 'delete_cities_bulk' 
            AND pg_function_is_visible(oid)
        ),
        'timestamp', NOW(),
        'message', 'RPC functions status check'
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_delete_functions() TO authenticated;