% SC_frankencode.m
% vdw = 1.25; % REMOVE ME!!12/31/2019
% COPIED FROM SC_determine_PA.m
%% Determine Gauge Points                                                  
% Qarrays = 1; % 1 = All full point arrays.
capsid_name = strcat('xyz.',pdbid,'.pdb');
Qarrays = 0; % 0 = all 55 + double arrays.
mkplots = 0; min_atoms = 10;
    threshold = 8; % For BAD distance at Gauge Point optimal scaling.
% app = Atoms Per Protein

au = load(capsid_name); [nau,o] = size(au);
%FIX
%SEGLIST??%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
seglist = [1 2 3 4 5 6 7 11 12 13 14 15 16 17];
seglist = 1:60;
nprot = Tnum*numel(seglist);
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
[ipp] = fn_buildipp(app,Tnum,nprot); natoms_prot = ipp;
[au,au_save,flag] = fn_centre_au(au,ipp,Tnum);
%flag = 1;
if flag == 1
    disp('au centered')
end
[convex,beads,shells,pcutoff,vdw,tol,digits,top_per,use_pmult,X2,outer_topo_only,Xfrac,NP] = inputs_vpa_pathwayX(Tnum);
vdw = 1.5; % REMOVE ME!!12/31/2019
label_out_tops = strcat('topo_',capsid_name);
[atoms] = fn_apply_icos3d_rots(au,seglist); [natoms,o] = size(atoms); 
r_au    = calc_radii(au);           maxR_au    = max(r_au);   minR_au    = min(r_au);   aveR_au    = mean(r_au);
ratoms  = calc_radii(atoms,digits); maxR_atoms = max(ratoms); minR_atoms = min(ratoms); aveR_atoms = mean(ratoms);

% Sweep the Point Arrays
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% VIRAL CAPSID at current BEAD
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
nclouds = 569; offset = 5; % Initial scaling above capsid.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% load point_arrays_norm2one_conv.mat
load point_arrays_norm2one_conv_aug2.mat %Augmented Topid % Still includes d1 = 0, x< 0 pts
% load Qvpa55.mat Mvpa = Qvpa;
%[namelist] = fn_namelist();
[namelist] = fn_namelist_matrix(); %matrix entered form.
[otopid, top_hulls] = fn_get_topologyhulls(Mvpa);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%               %%%%%%%%%%%%%%%%%%%%%%% % % Topological Scaling % %
%               %%%%%%%%%%%%%%%%%%%%%%% %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

p = 1;
for m = 1:21
    vpa_hull = top_hulls(m).top;
    [x,nvpa_hull] = size(vpa_hull);
    maxR_vpa = max(calc_radii(vpa_hull));
    [dist_surf,nearest,length_all] = fn_dock2capsid(atoms,maxR_atoms,maxR_vpa,natoms_prot,nprot,nvpa_hull,offset,pcutoff,vdw,vpa_hull);
    
    top_scale(m) = length_all(end)/maxR_vpa;
    top_dist(m)  = dist_surf(end);
    top_hulls(m).gaugepoints = top_hulls(m).top*top_scale(m);
    for n = 1:nvpa_hull
        scaled_hulls(1:3,p) = vpa_hull(1:3,n)*top_scale(m);
        unscaled_hulls(1:3,p) = vpa_hull(1:3,n);
        p = p + 1;
    end
end
%

fn_output_vpa(scaled_hulls',label_out_tops)

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Topographical Considerations %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

[group_au,group,centresN3,Rcom,Rmax_all,Natoms_all,nu_all,topsid,Rcom_back] = fn_topography(atoms,seglist,mkplots,min_atoms);
[o,Ng] = size(group_au);

for m = 1:Ng
    mstr = num2str(m);
    label_out_features = strcat('feature_',mstr,'_',capsid_name);
    fn_output_vpa(group_au(m).atoms,label_out_features)
end

%[group,tail,eta2,centresN3,Ng,topsid] =
%fn_topography(au,nau,r_au,maxR_au,aveR_au,minR_au,Xfrac,seglist); % OLD
%METHOD
[maxRcom,indC] = max(Rcom);
[maxRall,indA] = max(Rmax_all);
hooplah = 1:Ng;
% if indC == indA
%     hooplah = indC
% end

mu = 0.0480;
ang_gp_centre = []; dist_gp_centre = []; admissible = []; dadm = []; 
for j = 1:Ng
    hands = [];
    zah = intersect(j,hooplah);
    if numel(zah) == 0
       continue
    end
    centre = centresN3(j,:);
    nu_cut = nu_all(j);
    nu_cut;
    [temp_admin,dist_admin,ang_gp_centre,dist_gp_centre] = fn_calc_admissible(centre,nu_cut,top_hulls,j,ang_gp_centre,dist_gp_centre);
    ang_gp_centre;
    while numel(temp_admin) == 0
        disp(['Warning: No admissible Gauge Points for Group:',num2str(j),' looking ...'])
        
        nu_cut = nu_cut + mu;
        [temp_admin,dist_admin,ang_gp_centre,dist_gp_centre] = fn_calc_admissible(centre,nu_cut,top_hulls,j,ang_gp_centre,dist_gp_centre);
        if numel(temp_admin) ~= 0
            disp(['Admissible Gauge Points for Group:',num2str(j),' was found, admitting GP: ',num2str(temp_admin)])
        end
    end
    hands = temp_admin;
    keepers(j).holding = hands;
    keepers(j).angles = ang_gp_centre(j,temp_admin);
    if numel(temp_admin) > 2
        kick_haz = [];
        cut_ang = min(keepers(j).angles) + 2*pi/180;
        for yy = 1:numel(temp_admin)
            if keepers(j).angles(yy) > cut_ang
                kick_haz = [kick_haz; yy];
            end
        end
        temp_admin(kick_haz) = [];
    end

    admissible = [admissible,temp_admin];
    dadm = [dadm,dist_admin];
end

[admissible,ia,ic] = unique(admissible) 
d2c_topography = dadm(ia);
% admissible
%clc
X = [];
for m = 1:Ng
    X = [keepers(m).holding', (keepers(m).angles)'*180/pi]
end
%%%%% Alternate Oct 12th 2019 text moved down
% admissible = X(:,1);
% [admissible,ia,ic] = unique(admissible);

d2c_topography = dadm(ia);

%
% ind219 = 1; for m = admissible
%     Radm(ind219) = calc_radii(top_hulls(m).gaugepoints); ind219 = ind219
%     + 1;
% end

% figure hold all for m = 1:numel(admissible)
%     plot3d(top_hulls(admissible(m)).gaugepoints,'r*');
%     plot3d(top_hulls(admissible(m)).gaugepoints,'ko');
% end for j = 1:Ng
%     plot3d(group_au(j).atoms,'.') plot3d(group_au(j).com,'g*')
%     plot3d(group_au(j).com,'ks')
% end plot3d(au,'k:') fn_add2plot_auvol(Rsurf) axis equal SHUNT RANGE %
% MOVE TO FUNCTION LATER

for m = 1:21
    shunt_below(m) = top_scale(m) - topsid;
    if shunt_below(m) < 0
        shunt_below(m) = 0;
    elseif shunt_below(m) > 10
        shunt_below(m) = 10;
    end
    shunt_above(m) = (maxR_au + 5) - top_scale(m);
    if shunt_above(m) > 10
        shunt_above(m) = 10;
    end
end
shunt_below = round(10*round(100*shunt_below)/100)/10;
shunt_above = round(10*round(100*shunt_above)/100)/10;
%[admissible,d2c_topography,shunt_above,shunt_below] =
%fn_det_admissible_gp(centresN3,Ng,top_hulls,top_scale,topsid,vdw,maxR_au);
%% Determine Allowable Point Arrays.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% % % SWEEP ALL
%                   ADMISSIBLE ARRAYS % % %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
s = 1; % Point Arrays Used
if Qarrays == 1
    load Qvpa55.mat
    nclouds = 55;
    for m = 1:nclouds
        subject = Qvpa(m).vpa_au;
        test = max(calc_radii(subject));
        Qvpa(m).vpa_au = subject/test;
    end
    oVPA = Mvpa; % original VPA
    Mvpa = Qvpa;
end
results = [];
for qz = 1:55 %50:50
    vpa_topid     = Mvpa(qz).topid;
    vpa_topid_all = vpa_topid;
    good = numel(intersect(vpa_topid,admissible));
    [val,ivpa,iadm] = intersect(vpa_topid,admissible);
    if good > 0
        pau(s) = qz;
        s = s + 1;
    end
end

% Sweep Point Arrays % The Run
results = []; s = 1;
%% COPIED FROM vpa_pathwayX.m
%% 
% vv COMMENTED OUT AS DUPLICATE TO LINE 25 on 12-31-2019
% digits = 1E4; 
% mkplots = 0; min_atoms = 10;
% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% seglist = [1 2 3 4 5 6 7 11 12 13 14 15 16 17];
% %seglist = [1 2 3 4 5 6 7 11 12 13       16 17];
% nprot = Tnum*numel(seglist);
% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% au = load(capsid_name); [nau,o] = size(au);
% 
% [ipp] = fn_buildipp(app,Tnum,nprot); natoms_prot = ipp;
% [au,au_save,flag] = fn_centre_au(au,ipp,Tnum);
% %flag = 1;
% if flag == 1
%     disp('au centered')
% end
% 
% label_out_tops = strcat('topo_',capsid_name);
% [atoms] = fn_apply_icos3d_rots(au,seglist); [natoms,o] = size(atoms); 
% r_au    = calc_radii(au);           maxR_au    = max(r_au);   minR_au    = min(r_au);   aveR_au    = mean(r_au);
% ratoms  = calc_radii(atoms,digits); maxR_atoms = max(ratoms); minR_atoms = min(ratoms); aveR_atoms = mean(ratoms);
%[convex,beads,shells,pcutoff,vdw,tol,digits,top_per,use_pmult,X2,outer_topo_only,Xfrac,NP] = inputs_vpa_pathwayX(Tnum);

% Sweep the Point Arrays
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% VIRAL CAPSID at current BEAD
% pathway startup
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% nclouds = 569; offset = 5; % Initial scaling above capsid.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% load point_arrays_norm2one_conv.mat
%load point_arrays_norm2one_conv_aug.mat %Augmented Topid % Still includes d1 = 0, x< 0 pts
% load point_arrays_norm2one_conv_aug2.mat %Augmented Topid % Still includes d1 = 0, x< 0 pts
%[namelist] = fn_namelist();
% [namelist] = fn_namelist_matrix(); %matrix entered form.
% ^^ COMMENTED OUT AS DUPLICATE TO LINE 25 on 12-31-2019
[topid, top_hulls] = fn_get_topologyhulls(Mvpa);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                                              %
%               %%%%%%%%%%%%%%%%%%%%%%%                                        %
%               % Topological Scaling %                                        %
%               %%%%%%%%%%%%%%%%%%%%%%%                                        %
%                                                                              %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
p = 1;
for m = 1:21
    vpa_hull = top_hulls(m).top;
    [x,nvpa_hull] = size(vpa_hull);
    maxR_vpa = max(calc_radii(vpa_hull));
    [dist_surf,nearest,length_all] = fn_dock2capsid(atoms,maxR_atoms,maxR_vpa,natoms_prot,nprot,nvpa_hull,offset,pcutoff,vdw,vpa_hull);
    
    top_scale(m) = length_all(end)/maxR_vpa;
    top_dist(m)  = dist_surf(end);
    top_hulls(m).gaugepoints = top_hulls(m).top*top_scale(m);
    for n = 1:nvpa_hull
        scaled_hulls(1:3,p) = vpa_hull(1:3,n)*top_scale(m);
        p = p + 1;
    end
end
fn_output_vpa(scaled_hulls',label_out_tops)
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Topographical Considerations %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
[group_au,group,centresN3,Rcom,Rmax_all,Natoms_all,nu_all,topsid,Rcom_back] = fn_topography(atoms,seglist,mkplots,min_atoms);
[o,Ng] = size(group_au);

%[group,tail,eta2,centresN3,Ng,topsid] = fn_topography(au,nau,r_au,maxR_au,aveR_au,minR_au,Xfrac,seglist); % OLD METHOD
[maxRcom,indC] = max(Rcom);
[maxRall,indA] = max(Rmax_all);
hooplah = 1:Ng
if indC == indA
    hooplah = indC
end
mu = 0.0480;
% trying to use my NEWER version of admissible
saveadmin = admissible;
ang_gp_centre = []; dist_gp_centre = []; dadm = []; admissible = [];
for j = 1:Ng
    hands = [];
    zah = intersect(j,hooplah);
    if numel(zah) == 0
       continue
    end
    centre = centresN3(j,:);
    nu_cut = nu_all(j);
    [temp_admin,dist_admin,ang_gp_centre,dist_gp_centre] = fn_calc_admissible(centre,nu_cut,top_hulls,j,ang_gp_centre,dist_gp_centre);
    while numel(temp_admin) == 0
        disp(['Warning: No admissible Gauge Points for Group:',num2str(j),' looking ...'])
        nu_cut = nu_cut + mu;
        [temp_admin,dist_admin,ang_gp_centre,dist_gp_centre] = fn_calc_admissible(centre,nu_cut,top_hulls,j,ang_gp_centre,dist_gp_centre);
        if numel(temp_admin) ~= 0
            disp(['Admissible Gauge Points for Group:',num2str(j),' was found, admitting GP: ',num2str(temp_admin)])
        end
    end
    hands = temp_admin;
    keepers(j).holding = hands;
    keepers(j).angles = ang_gp_centre(j,temp_admin);
    if numel(temp_admin) > 2
        kick_haz = [];
        cut_ang = min(keepers(j).angles) + 2*pi/180;
        for yy = 1:numel(temp_admin)
            if keepers(j).angles(yy) > cut_ang
                kick_haz = [kick_haz; yy];
            end
        end
        temp_admin(kick_haz) = []
    end

    admissible = [admissible,temp_admin];
    dadm = [dadm,dist_admin];
end

[admissible,ia,ic] = unique(admissible);
d2c_topography = dadm(ia);
admissible = saveadmin;
%
% figure
% hold all
% for m = 1:numel(admissible)
%     plot3d(top_hulls(admissible(m)).gaugepoints,'r*');
%     plot3d(top_hulls(admissible(m)).gaugepoints,'ko');
% end
% for j = 1:Ng
%     plot3d(group_au(j).atoms,'.')
%     plot3d(group_au(j).com,'g*')
%     plot3d(group_au(j).com,'ks')
% end
% plot3d(au,'k:')
% fn_add2plot_auvol(Rsurf)
% axis equal
% SHUNT RANGE % MOVE TO FUNCTION LATER
for m = 1:21
    shunt_below(m) = top_scale(m) - topsid;
    if shunt_below(m) < 0
        shunt_below(m) = 0;
    elseif shunt_below(m) > 10
        shunt_below(m) = 10;
    end
    shunt_above(m) = (maxR_au + 5) - top_scale(m);
    if shunt_above(m) > 10
        shunt_above(m) = 10;
    end
end
shunt_below = round(10*round(100*shunt_below)/100)/10;
shunt_above = round(10*round(100*shunt_above)/100)/10;
%[admissible,d2c_topography,shunt_above,shunt_below] = fn_det_admissible_gp(centresN3,Ng,top_hulls,top_scale,topsid,vdw,maxR_au);
%% Sweep Point Arrays % The Run
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                                              %
%                   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                            %  
%                   % SWEEP ALL ADMISSIBLE ARRAYS %                            %
%                   %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                            %
%                                                                              %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
s = 1; % Point Arrays Used
results = []
admissible
for qz = 1:nclouds %50:50
    vpa_topid     = Mvpa(qz).topid;
    vpa_topid_all = vpa_topid;
    good = numel(intersect(vpa_topid,admissible));
    [val,ivpa,iadm] = intersect(vpa_topid,admissible);
    
    if good > 0
        pau(s) = qz;
        s = s + 1;
    end
end
s = 1;
%pau = [14, pau];
for m = 1:numel(pau)
    %if good > 0
%     if pau(m) > 55
%         break
%     end
        qz = pau(m);
            vpa_topid     = Mvpa(qz).topid;

%        pau(s) = qz;
        [o,Nvpa_topid] = size(vpa_topid);
        if Nvpa_topid > 1
            temp = intersect(vpa_topid,admissible);
            temp_length = top_scale(temp);
            [val,ind] = max(temp_length);
            vpa_topid = temp(ind);
        end
        
        length      = top_scale(vpa_topid);
        above       = shunt_above(vpa_topid);
        below       = shunt_below(vpa_topid);
        d2top_gauge = d2c_topography(iadm);
    
        % MOVE TO A FUNCTION ?
        vpa_au    = Mvpa(qz).vpa_au;      [o,nvpa]       = size(vpa_au); %stored as a 3xNvpa
%         vpa_sec   = Mvpa(qz).vpa_sec;     [o,nvpa_sec]   = size(vpa_sec);
%         vpa_nn    = Mvpa(qz).vpa_nn;      [o,nvpa_nn]    = size(vpa_nn);
        vmult     = Mvpa(qz).vpa_mult;
%         vpa_out   = Mvpa(qz).vpa_sec_out; [o,nvpa_out]   = size(vpa_out);
%         vpa_outer = Mvpa(qz).vpa_outer;   [o,nvpa_outer] = size(vpa_outer);
%         vpa_full  = Mvpa(qz).vpa;         [o,nvpa_full]  = size(vpa_full);

        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        % Populate array from Topology.
        vpa_radii     = calc_radii(vpa_au);
        maxR_vpa      = max(vpa_radii);
        scale_gauge   = length/maxR_vpa;
        d_gauge       = round(100*top_dist(vpa_topid))/100;
        vpa_sc        = vpa_au*scale_gauge;
        vpa_radii_sc  = vpa_radii*scale_gauge;
        
        [tpa,ntpa] = fn_truncate_pointarray_width(minR_au,maxR_au,vpa_au);
        tpa_gauge  = tpa*scale_gauge;
        ntpa_gauge = ntpa;        
        length_gauge = length;
        radii_gauge  = vpa_radii_sc;

        % Calculate Gauge RMSD
        [vpa_d2p,d2p_sort_gauge,pcount_gauge,pn_index,vpa_i2a] = fn_min_dist2prot(atoms,natoms_prot,nprot,tpa_gauge,ntpa_gauge,pcutoff);
        d2p_sort_gauge = round(100*d2p_sort_gauge)/100;
        [rmsd_gauge] = fn_rmsd_surf_au_pcounts(d2p_sort_gauge,pcount_gauge,vmult,use_pmult,vdw,ntpa_gauge);
        [allprots_gauge,dmat_gauge,prot_nums_gauge] = fn_all_proteins_included(d2p_sort_gauge,ipp,ntpa_gauge,nprot,pcount_gauge,Tnum,vpa_i2a);
        if allprots_gauge == 0
            rmsd_gauge = 999;
        end
        
        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        % Shunt Arrays based on Gauge Point %
        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% 
        sift = 0.25; range_shunt = -below:sift:above;

        % Shunt Below
        [ntpa_sweep,scale_sweep,allprots_sweep,rmsd_sweep,length_sweep,proxy,t] = fn_shunt_down(sift,below,length,maxR_vpa,ntpa_gauge,tpa,atoms,natoms_prot,nprot,pcutoff,ipp,vmult,vdw,Tnum,use_pmult,topsid,qz);
        % Shunt Above
        [ntpa_sweep,scale_sweep,allprots_sweep,rmsd_sweep,length_sweep,proxy]   = fn_shunt_up(sift,above,length,maxR_vpa,ntpa_gauge,tpa,atoms,natoms_prot,nprot,pcutoff,ipp,vmult,vdw,Tnum,use_pmult,topsid,t,ntpa_sweep,scale_sweep,allprots_sweep,rmsd_sweep,length_sweep,proxy,maxR_au,qz);
        
        if numel(unique(rmsd_sweep)) == 1
            if unique(rmsd_sweep) == 999
                disp('Dead Array, Only 1 possible scaling?')
                step = 1;
                rmsd_shunt = 999;
            end
        else
            temp = rmsd_sweep;
            rmsd_sweep(allprots_sweep == 0) = 999;
            [rmsd_shunt,step] = fn_detect_pocket(rmsd_sweep);
            if rmsd_shunt == 999
                disp('Does not describe all proteins.')
                rmsd_sweep = temp;
                [rmsd_shunt,step] = fn_detect_pocket(rmsd_sweep);
            end
            if step == 2 || step == (numel(rmsd_sweep)-1)
                disp('Potential end Point Issue')
            end
        end
        %ntpa_shunt        = ntpa_sweep(step);
        prot_nums_shunt   = proxy(step).prot_nums_sweep;
        dmat_shunt        = proxy(step).dmat_sweep;
        allprots_shunt    = allprots_sweep(step);
        length_shunt      = length_sweep(step); %range_shunt(step) + length_gauge;
        scale_shunt       = scale_sweep(step); %levels_shunt      = levels_sweep(step);
        d2p_sort_shunt    = proxy(step).d2p_sort;
        pcount_shunt      = proxy(step).pcount;
        tpa_shunt         = proxy(step).tpa_sweep;
        radii_shunt       = vpa_radii*scale_sweep(step);
        d_shunt           = proxy(step).d2p_sort(1,1);
        
        gps = top_hulls(vpa_topid).top*length_shunt;
        %d2top_shunt       = min(fn_distanceA2B(centresN3',tpa_shunt(:,1)));
        d2top_shunt       = min(min(fn_distanceA2B(centresN3',gps)));
        rmsd_sweep(rmsd_sweep == 999) = -1;
%         for m = 1:numel(rmsd_sweep)
%             if rmsd_sweep(m) == 999
%                 rmsd_sweep(m) = -1;
%             end
%         end
        %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        % Output Results
        if qz < 56
            results(qz).name      = [qz qz];
        else
            results(qz).name(1:2) = namelist((qz-55),:);
        end

        results(qz).topid        = vpa_topid_all;
        results(qz).topid_used   = vpa_topid;
        results(qz).vmult        = vmult;
        results(qz).ntpa         = ntpa_gauge;
        results(qz).rmsd         = [rmsd_shunt ,rmsd_gauge];   % RMSD_gauge

        results(qz).prot_all     = [allprots_shunt, allprots_gauge];
        results(qz).dsurf_top    = [d_shunt, d_gauge];      % dist to topo
        results(qz).d2c_gp       = round(100*[d2top_shunt,d2top_gauge])/100; % FIX ME HERE TOO
        results(qz).scale        = [scale_shunt,scale_gauge];  % scale_gauge
        results(qz).ratio_radii  = [max(radii_shunt)/maxR_au, max(radii_gauge)/maxR_au];
        
        results(qz).pcount_gauge = pcount_gauge; % pcount_gauge
        results(qz).pcount_shunt = pcount_shunt; % pcount_shunt
        
        results(qz).rmsd_sweep   = rmsd_sweep;
        results(qz).all_p_sweep  = allprots_sweep;
        results(qz).shunt_step   = step;
        
        results(qz).p_nums_gauge = prot_nums_gauge';
        results(qz).p_nums_shunt = prot_nums_shunt';

        results(qz).radii_gauge  = radii_gauge;  % radii_gauge
        results(qz).radii_shunt  = radii_shunt;  % radii_shunt
        
        results(qz).tpa_gauge    = tpa_gauge;    % tpa_gauge
        results(qz).tpa_shunt    = tpa_shunt;    % tpa_radii_shunt
        
        results(qz).dmat_gauge   = dmat_gauge;   % dmatrix_gauge
        results(qz).dmat_shunt   = dmat_shunt;   % dmatrix_shunt            
        
        results(qz).d2p_gauge    = d2p_sort_gauge; %THING
        results(qz).d2p_shunt    = d2p_sort_shunt; %THING        
        
        results(qz).scale_sweep  = scale_sweep;
        results(qz).length_sweep = length_sweep;
        results(qz).range_shunt  = range_shunt;
        results(qz).vpa_hull     = vpa_hull;
        results(qz).proxy        = proxy;
        results(qz).length       = [length_shunt, length_gauge]; % length_gauge
            G(1,s) = qz;
            G(2,s) = rmsd_shunt;
            G(3,s) = rmsd_gauge;
            G(4,s) = ntpa_gauge;
            G(5,s) = vpa_topid;
            s = s + 1;
        %results(qz).d2centre_shunt  = ;
        %results(qz).ratio_shunt     = ;
        %results(qz).length_shunt    = ; % length_shunt
        % results(qz).rmsd_shunt      = rmsd_shunt;   % RMSD_shunt
        % results(qz).scale_shunt     = ;  % scale_shunt
        % results(qz).ntpa_shunt      = ntpa_shunt;
        % results(qz).ntpa_sweep      = ntpa_sweep;
        % results(qz).all_p_shunt     = ;
        % results(qz).prot_mat        = prot_mat; % should they be shunt recorded?
        % results(qz).levels_sweep    = levels_sweep;        
        % results(qz).top_dsurf_shunt = ;
        % results(qz).levels_gauge    = levels_gauge; % levels_gauge
        % results(qz).levels_shunt    = levels_shunt; % levels_shunt
    %end
end
G = G';sortrows(G,2)

%start Gabe's code

%write excel results
gs = sortrows(G,2);
cols = {'PA #';'RMSD';'IGNORE';'NAU';'GP'};
T = array2table(gs, 'VariableNames', cols);
writetable(T, (append(pdbid,'.xlsx'))); %write the unique columns to excel sheet

%get & write 5 best pas
list = gs(1:5,1);
N = numel(list);

for mm = 1:N

    m = list(mm);

    paN3 = results(m).tpa_shunt';

    [class_pa] = fn_output_pa2pdb(paN3,m,pdbid,'pa');

end
%end Gabe's code

disp('Done.')
%disp('Done ... time for fancier pcount?')    
