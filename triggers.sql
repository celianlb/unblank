public :

before_folder_delete_move_links : move_links_to_recents_before_folder_delete()
on_user_created_default_folders : create_default_folders()
prevent_delete_recents : prevent_recents_folder_deletion()
update_folders_updated_at : update_updated_at()
update_links_updated_at : update_updated_at()
update_shares_updated_at : update_updated_at()
update_users_updated_at : moddatetime()

auth :
on_auth_user_created : handle_new_user()
on_auth_user_created_avatar : queue_avatar_sync()