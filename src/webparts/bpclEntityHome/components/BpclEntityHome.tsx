import * as React from 'react';
import type { IBpclEntityHomeProps } from './IBpclEntityHomeProps';

import BpclEntityHomeServices, { INavigationMenuItem, IQuickLinkItem, IAttachment, IWelcomeBannerItem, IDirectorCornerItem, IHighlightItem, IAwardItem, IGovernanceItem, ICorporateNewsItem, INewsPreviewItem, IEventPreviewItem, IBroadcastItem, IBUContactUsItem, IBusinessUnitItem, IVMVItem } from "../Services/BpclEntityHomeServices";
import UserProfileService, { ITeamMember } from "../Services/UserProfileService";
import '@fontsource/inter';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './BpclEntityHome.module.scss';
//import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { Swiper, SwiperSlide } from 'swiper/react';
//import { Swiper as SwiperType } from "swiper";

import { Autoplay, Navigation } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

//import { CardBody } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Button } from 'react-bootstrap';
import { Form, InputGroup } from 'react-bootstrap';

import { Nav, Navbar, Carousel } from "react-bootstrap";
import 'bootstrap-icons/font/bootstrap-icons.css';

import MessagePreviewModal from "../Services/MessagePreviewModal";

import TeamProfileModal from "../Services/TeamProfileModal";
import Loader from "../Services/Loader";
import PreviewNewsModal from "../Services/PreviewNewsModal";
import PreviewBroadcastModal from "../Services/PreviewBroadcastModal";
import PreviewEventsModal from "../Services/PreviewEventsModal";
import { StaffPostingService } from "../Services/StaffPostingService";
import StaffPostingModal from "../Services/StaffPostingModal";
import { NavDropdown } from "react-bootstrap";

/* ---------------- TYPES ---------------- */
interface ITeamSiteMaster {
  TeamName: string;
  Category?: string;
  SiteURL?: {
    Url: string;
  };
}

interface IComponentState {
  sbu: string;
  category?: string;
  isLoading: boolean;
  isMobileMenuOpen: boolean;
  itemsPerSlide: number;
  isPaused: boolean;
  activeTab: string;
  quickLinks: IQuickLinkItem[];
  businessUnits: IBusinessUnitItem[];
  vmvItems: IVMVItem[];
  corporateNews: ICorporateNewsItem[];
  events: ICorporateNewsItem[];
  broadcasts: IBroadcastItem[];
  navigationMenu: INavigationMenuItem[];
  welcomeBanners: IWelcomeBannerItem[];
  directorCorner: IDirectorCornerItem[];
  awards: IAwardItem[];
  contactUsSlides: IBUContactUsItem[];
  governanceItems: IGovernanceItem[];
  highlightsData: {
    [key: string]: IHighlightItem[];
  };
  teamMembers: ITeamMember[];
  myDepartment: string;

  showPreview: boolean;
  previewItem?: IBroadcastItem;
  previewAttachments: IAttachment[];

  showMessagePreview: boolean;
  selectedLeader?: IDirectorCornerItem;
  activeImageIndex: number;

  showEventPreview: boolean;
  previewEventItem?: IEventPreviewItem;
  previewEventAttachments: IAttachment[];

  showNewsPreview: boolean;
  selectedNewsItem?: INewsPreviewItem;
  newsAttachments: IAttachment[];


  modalshow: boolean;
  selectedTeamMember?: ITeamMember;

  filteredTeamMembers: ITeamMember[];
  searchText: string;

  //pournami
  isBroadcastPaused: boolean;
  isEventPaused: boolean;


  //Navigation menu
  overflowMenus: INavigationMenuItem[];
  visibleMenus: INavigationMenuItem[];
  showOverflowMenus: boolean;

}



/* ---------------- COMPONENT ---------------- */


export default class EntityHome extends React.Component<
  IBpclEntityHomeProps,
  IComponentState
> {

  private hasTeamLoaded = false;
  private sbuTeamSectionRef = React.createRef<HTMLDivElement>();
  private sbuTeamObserver?: IntersectionObserver;



  private async getSBUFromList(): Promise<{ value: string; category?: string } | null> {
    try {
      const currentFullUrl = window.location.href.toLowerCase();

      const items: ITeamSiteMaster[] =
        await this.entityHomeService.publishingHubSp.web.lists
          .getByTitle("TeamSiteMaster")
          .items
          .select("TeamName", "Category", "SiteURL")();

      for (let i = 0; i < items.length; i++) {
        const siteUrl = items[i].SiteURL?.Url?.toLowerCase();

        if (!siteUrl) continue;


        const normalizedSiteUrl = siteUrl.replace(/\/$/, "");


        if (currentFullUrl.startsWith(normalizedSiteUrl)) {
          return {
            value: items[i].TeamName,
            category: items[i].Category
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
      return null;
    }
  }

  private entityHomeService!: BpclEntityHomeServices;
  private userProfileService!: UserProfileService;
  private staffPostingService!: StaffPostingService;
  private menuContainerRef = React.createRef<HTMLDivElement>();
  private resizeHandler!: () => void;

  private getTopLevelMenus = (): INavigationMenuItem[] => {
    return this.state.navigationMenu
      .filter(item => !item.ParentId)
      .sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));
  };


  private splitMenus = (): void => {

    const menus = this.getTopLevelMenus();
    const container = this.menuContainerRef.current;
    if (!container) return;



    if (window.innerWidth <= 1024) {
      this.setState({
        visibleMenus: menus,
        overflowMenus: []
      });
      return;
    }

    /* -----------------------------
       DESKTOP WIDTH CALCULATION
    ------------------------------*/

    //  IMPORTANT: use menuWrapper instead of navbar
    const menuWrapper = container.closest(`.${styles.menuWrapper}`) as HTMLElement;

    const chevron = container
      .closest("nav")
      ?.querySelector(`.${styles.chevron}`) as HTMLElement;

    // ✅ Correct width (actual usable area)
    const totalWidth =
      menuWrapper?.offsetWidth || container.offsetWidth;

    const chevronWidth = chevron ? chevron.offsetWidth : 44;

    // small buffer to avoid edge overflow
    const buffer = 20;

    const availableWidth = Math.max(
      totalWidth - chevronWidth - buffer,
      0
    );

    let usedWidth = 0;

    const visibleMenus: INavigationMenuItem[] = [];
    const overflowMenus: INavigationMenuItem[] = [];

    /* -----------------------------
       CREATE TEMP ELEMENT FOR WIDTH
    ------------------------------*/

    const tempContainer = document.createElement("div");
    tempContainer.style.visibility = "hidden";
    tempContainer.style.position = "absolute";
    tempContainer.style.whiteSpace = "nowrap";
    tempContainer.style.top = "-9999px";
    document.body.appendChild(tempContainer);

    menus.forEach(menu => {

      const temp = document.createElement("span");
      temp.className = styles.menuItem;
      temp.innerText = menu.Title;

      tempContainer.appendChild(temp);

      // spacing + padding + gap
      const width = temp.offsetWidth + 32;

      if (usedWidth + width <= availableWidth) {
        visibleMenus.push(menu);
        usedWidth += width;
      } else {
        overflowMenus.push(menu);
      }

      tempContainer.removeChild(temp);

    });

    document.body.removeChild(tempContainer);

    /* -----------------------------
       APPLY STATE
    ------------------------------*/

    this.setState({
      visibleMenus,
      overflowMenus
    });

  };

  private getChildMenus = (parentId: number): INavigationMenuItem[] => {
    return this.state.navigationMenu
      .filter(item => item.ParentId?.Id === parentId)
      .sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));
  };


  constructor(props: IBpclEntityHomeProps) {
    super(props);

    this.state = {
      sbu: "",
      isLoading: true,
      isMobileMenuOpen: false,
      itemsPerSlide: this.getItemsPerSlide(),
      isPaused: false,
      activeTab: "performanceHighlights",

      quickLinks: [],
      businessUnits: [],
      vmvItems: [],
      corporateNews: [],
      events: [],
      navigationMenu: [],
      welcomeBanners: [],
      directorCorner: [],
      awards: [],
      contactUsSlides: [],
      governanceItems: [],
      highlightsData: {
        performanceHighlights: [],
        successStories: [],
        testimonials: []
      },
      broadcasts: [],
      teamMembers: [],
      myDepartment: "",
      showPreview: false,
      previewItem: undefined,
      previewAttachments: [],

      showMessagePreview: false,
      selectedLeader: undefined,
      activeImageIndex: 0,

      showEventPreview: false,
      previewEventItem: undefined,
      previewEventAttachments: [],

      showNewsPreview: false,
      selectedNewsItem: undefined,
      newsAttachments: [],


      modalshow: false,
      selectedTeamMember: undefined,

      filteredTeamMembers: [],
      searchText: "",


      isBroadcastPaused: false,
      isEventPaused: false,

      //Navigation Menus
      visibleMenus: [],
      overflowMenus: [],
      showOverflowMenus: false



    };

  }

  private getItemsPerSlide = (): number => {
    const width = window.innerWidth;
    if (width < 576) return 1;
    if (width < 992) return 2;
    return 4;
  };

  // private handleResize = (): void => {
  //   const newSize = this.getItemsPerSlide();
  //   if (newSize !== this.state.itemsPerSlide) {
  //     this.setState({ itemsPerSlide: newSize });
  //   }
  // };

  private handleResize = (): void => {
    const newSize = this.getItemsPerSlide();
    if (newSize !== this.state.itemsPerSlide) {
      this.setState({ itemsPerSlide: newSize });

    }
    this.splitMenus();
  };



  public async componentDidMount(): Promise<void> {


    this.entityHomeService = new BpclEntityHomeServices(this.props.context);
    this.userProfileService = new UserProfileService(this.props.context);
    this.staffPostingService = new StaffPostingService(

      this.entityHomeService.publishingHubSp,

      this.props.context

    );


    window.addEventListener("resize", this.resizeHandler);
    const result = await this.getSBUFromList();

    const sbu = result?.value || "INFORMATION SYSTEMS";
    const category = result?.category || "";

    try {
      const [navigationMenu, quickLinks, welcomeBanners, directorCorner, businessUnits, vmvItems, corporateNews, events, broadcasts, awards, contactUsSlides, governanceItems, performanceHighlights, successStories, testimonials] = await Promise.all([
        this.entityHomeService.getNavigationMenu(),
        this.entityHomeService.getQuickLinks(),
        this.entityHomeService.getWelcomeBanners(),
        this.entityHomeService.getDirectorCorner(),
        this.entityHomeService.getBusinessUnits(),
        this.entityHomeService.getVisionMissionValues(),
        this.entityHomeService.getCorporateNews(sbu, category),
        this.entityHomeService.getEvents(sbu, category),
        this.entityHomeService.getBroadcasts(sbu, category),
        this.entityHomeService.getAwards(),
        this.entityHomeService.getContactUsSlides(),
        this.entityHomeService.getGovernanceCarousel(),
        this.entityHomeService.getPerformanceHighlights(),
        this.entityHomeService.getSuccessStories(),
        this.entityHomeService.getTestimonials()


      ]);

      const topLevelMenus = navigationMenu
        .filter(m => !m.ParentId)
        .sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));

      this.setState({
        sbu, category, navigationMenu, visibleMenus: topLevelMenus, quickLinks, welcomeBanners, directorCorner, businessUnits, vmvItems, corporateNews, events, broadcasts, awards, contactUsSlides, governanceItems, highlightsData: {
          performanceHighlights, successStories, testimonials
        }, isLoading: false
      }, () => {
        requestAnimationFrame(() => this.splitMenus());
      });

      // 🔹 PHASE 2 – LOAD TEAM AFTER RENDER
      requestAnimationFrame(() => {
        this.observeSBUTeamSection();
      });



    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }


  }

  private loadTeamMembers = async (): Promise<void> => {
    if (this.hasTeamLoaded) return;
    this.hasTeamLoaded = true;

    try {
      await this.userProfileService.getTenantUsers( // ✅ FIXED
        this.state.sbu,
        this.state.category,
        (batch) => {
          this.setState(prev => ({
            teamMembers: [...prev.teamMembers, ...batch],
            filteredTeamMembers: [...prev.filteredTeamMembers, ...batch]
          }));
        }
      );
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private observeSBUTeamSection = (): void => {
    if (!this.sbuTeamSectionRef.current) return;

    this.sbuTeamObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.sbuTeamObserver?.disconnect();
          this.sbuTeamObserver = undefined;
          this.loadTeamMembers().catch(() => {
            console.log("Something went wrong. Please contact administrator.");
          });
        }
      },
      {
        threshold: 0,
        rootMargin: "150px"
      }
    );

    this.sbuTeamObserver.observe(this.sbuTeamSectionRef.current);
  };

  private toggleBroadcast = (): void => {
    this.setState(prevState => ({
      isBroadcastPaused: !prevState.isBroadcastPaused
    }));
  };

  private toggleEvent = (): void => {
    this.setState(prevState => ({
      isEventPaused: !prevState.isEventPaused
    }));
  };



  private openMessagePreview = (leader: IDirectorCornerItem): void => {
    this.setState({
      showMessagePreview: true,
      selectedLeader: leader,
      activeImageIndex: 0
    });
  };

  private closeMessagePreview = (): void => {
    this.setState({
      showMessagePreview: false,
      selectedLeader: undefined,
      activeImageIndex: 0
    });
  };



  private setActiveImage = (index: number): void => {
    this.setState({ activeImageIndex: index });
  };

  private modalOpen = (member: ITeamMember): void => {
    this.setState({
      modalshow: true,
      selectedTeamMember: member
    });
  };

  private modalClose = (): void => {
    this.setState({
      modalshow: false,
      selectedTeamMember: undefined
    });
  };

  private openNewsPreview = async (
    item: ICorporateNewsItem
  ): Promise<void> => {
    try {

      // If Staff Posting → no need to fetch preview + attachments
      if (item.NewsTypes?.WssId === 24) {
        this.setState({
          showNewsPreview: true,
          selectedNewsItem: item,
          newsAttachments: []
        });
        return;
      }

      // Normal News Preview
      const [previewItem, attachments] = await Promise.all([
        this.entityHomeService.getNewsPreviewItem(item.Id),
        this.entityHomeService.getAttachments(item.Id)
      ]);

      if (!previewItem) return;

      this.setState({
        showNewsPreview: true,
        selectedNewsItem: previewItem,
        newsAttachments: attachments
      });

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeNewsPreview = (): void => {
    this.setState({
      showNewsPreview: false,
      selectedNewsItem: undefined,
      newsAttachments: []
    });
  };

  private openBroadcastPreview = async (item: IBroadcastItem): Promise<void> => {
    try {
      const attachments = await this.entityHomeService.getAttachments(item.Id);
      console.log("Broadcast attachments from service:", attachments);

      this.setState({
        showPreview: true,
        previewItem: item,
        previewAttachments: attachments
      });
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeBroadcastPreview = (): void => {
    this.setState({
      showPreview: false,
      previewItem: undefined,
      previewAttachments: []
    });
  };

  private openEventPreview = async (
    item: ICorporateNewsItem
  ): Promise<void> => {
    try {
      const [previewItem, attachments] = await Promise.all([
        this.entityHomeService.getEventPreviewItem(item.Id),
        this.entityHomeService.getAttachments(item.Id)
      ]);

      if (!previewItem) return;

      this.setState({
        showEventPreview: true,
        previewEventItem: previewItem,
        previewEventAttachments: attachments
      });
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeEventPreview = (): void => {
    this.setState({
      showEventPreview: false,
      previewEventItem: undefined,
      previewEventAttachments: []
    });
  };

  private handleTeamSearch = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {

    const rawValue = event.target.value.toLowerCase();

    // Reset when empty
    if (rawValue === "") {
      this.setState({
        searchText: "",
        filteredTeamMembers: [...this.state.teamMembers],
      });
      return;
    }

    const filteredTeamMembers = this.state.teamMembers.filter(member => {
      const name = member.DisplayName?.toLowerCase() || "";
      const email = member.Email?.toLowerCase() || "";
      const role = member.JobTitle?.toLowerCase() || "";
      const department = member.Department?.toLowerCase() || "";

      return (
        name.indexOf(rawValue) !== -1 ||
        email.indexOf(rawValue) !== -1 ||
        role.indexOf(rawValue) !== -1 ||
        department.indexOf(rawValue) !== -1
      );
    });

    this.setState({
      searchText: rawValue,
      filteredTeamMembers,
    });
  };

  private handleNewsLike = async (
    item: ICorporateNewsItem
  ): Promise<void> => {
    try {
      const updatedLikes = await this.entityHomeService.toggleLike(
        item.Id,
        item.liked === true
      );

      this.setState((prev) => ({
        corporateNews: prev.corporateNews.map((n) =>
          n.Id === item.Id
            ? {
              ...n,
              LikesCount: updatedLikes,
              liked: !n.liked
            }
            : n
        ),
      }));
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private handleEventLike = async (
    event: ICorporateNewsItem
  ): Promise<void> => {

    try {

      const updatedLikes = await this.entityHomeService.toggleLike(
        event.Id,
        event.liked === true
      );

      this.setState((prev) => ({
        events: prev.events.map((e) =>
          e.Id === event.Id
            ? {
              ...e,
              LikesCount: updatedLikes,
              liked: !e.liked
            }
            : e
        ),
      }));

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };


  public componentWillUnmount(): void {
    //window.removeEventListener('resize', this.handleResize);
    // 🔹 cleanup team observer
    window.removeEventListener("resize", this.handleResize);
    this.sbuTeamObserver?.disconnect();
  }

  private handleSubmenuPosition = (e: React.MouseEvent<HTMLDivElement>): void => {

    const el = e.currentTarget as HTMLElement;
    const submenu = el.querySelector('.dropdown-menu') as HTMLElement;

    if (!submenu) return;

    submenu.style.visibility = "hidden";
    submenu.style.display = "block";

    const rect = submenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    if (rect.right > viewportWidth) {
      el.classList.add("open-left");
    } else {
      el.classList.remove("open-left");
    }

    submenu.style.display = "";
    submenu.style.visibility = "";
  };



  private renderSubMenus = (parentId: number): React.ReactNode => {

    const children = this.getChildMenus(parentId);

    if (!children || children.length === 0) return null;

    return children.map(child => {

      const subChildren = this.getChildMenus(child.Id);

      // Normal item
      if (subChildren.length === 0) {
        return (
          <NavDropdown.Item
            key={child.Id}
            href={child.MenuUrl?.Url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {child.Title}
          </NavDropdown.Item>
        );
      }

      // Item with submenu
      return (
        // <div key={child.Id} className="dropdown-submenu has-children">

        <div
          key={child.Id}
          className="dropdown-submenu has-children"
          onMouseEnter={(e) => this.handleSubmenuPosition(e)}
        >

          <a
            className="dropdown-item dropdown-toggle"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            {child.Title}
          </a>

          <div className="dropdown-menu">
            {this.renderSubMenus(child.Id)}
          </div>

        </div>
      );

    });

  };


  public render(): React.ReactElement<IBpclEntityHomeProps> {


    const activeTab = this.state.activeTab;

    const missionItems = this.state.vmvItems;
    const totalItems = this.state.quickLinks.length;

    const handleTitleRef = (text: string) => (el: HTMLElement | null) => {
      if (!el) return;

      setTimeout(() => {
        const isOverflowing = el.scrollWidth > el.clientWidth;

        if (isOverflowing) {
          el.setAttribute("title", text);
        } else {
          el.removeAttribute("title");
        }
      }, 0);
    };


    return (
      <section>
        <Loader show={this.state.isLoading} />
        <Navbar expand="lg" sticky="top" className={`${styles.mainNavbar} quickLinksMenus`} >
          <Container fluid className={styles.navContainer}>

            {/* Brand */}
            <Navbar.Brand className={styles.brand}>
              {this.state.sbu}
            </Navbar.Brand>

            {/* Mobile Hamburger */}
            <div
              className={styles.mobileToggle}
              onClick={() =>
                this.setState({ isMobileMenuOpen: !this.state.isMobileMenuOpen })
              }
            >
              <i
                className={`bi ${this.state.isMobileMenuOpen ? "bi-x-lg" : "bi-list"
                  }`}
              />
            </div>

            {/* Menu Wrapper */}
            <div
              className={`${styles.menuWrapper} ${this.state.isMobileMenuOpen ? styles.mobileOpen : ""
                }`}
            >

              {/* First Row */}
              <div className={styles.firstRow}>

                <Nav ref={this.menuContainerRef} className={styles.menuNav}>

                  {this.state.visibleMenus.map(main => {

                    const children = this.getChildMenus(main.Id);

                    if (children.length === 0) {
                      return (
                        <Nav.Link
                          key={main.Id}
                          href={main.MenuUrl?.Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.menuItem}
                          onClick={() => this.setState({ isMobileMenuOpen: false })}
                        >
                          {main.Title}
                        </Nav.Link>
                      );
                    }

                    return (
                      <NavDropdown
                        key={main.Id}
                        title={main.Title}
                        id={`nav-dropdown-${main.Id}`}
                        className={styles.menuItem}
                      >
                        {this.renderSubMenus(main.Id)}
                      </NavDropdown>
                    );

                  })}

                </Nav>

                {/* Desktop Chevron */}
                {this.state.overflowMenus.length > 0 && (
                  <div
                    className={styles.chevron}
                    onClick={() =>
                      this.setState({
                        showOverflowMenus: !this.state.showOverflowMenus
                      })
                    }
                  >
                    <i
                      className={`bi ${this.state.showOverflowMenus
                        ? "bi-chevron-up"
                        : "bi-chevron-down"
                        }`}
                    />
                  </div>
                )}

              </div>

              {/* Second Row */}
              {this.state.showOverflowMenus && (
                <div className={styles.secondRow}>

                  <Nav className={styles.menuNav}>

                    {this.state.overflowMenus.map(main => {

                      const children = this.getChildMenus(main.Id);

                      if (children.length === 0) {
                        return (
                          <Nav.Link
                            key={main.Id}
                            href={main.MenuUrl?.Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.menuItem}
                          >
                            {main.Title}
                          </Nav.Link>
                        );
                      }

                      return (
                        <NavDropdown
                          key={main.Id}
                          title={main.Title}
                          id={`overflow-nav-${main.Id}`}
                          className={styles.menuItem}
                        >
                          {this.renderSubMenus(main.Id)}
                        </NavDropdown>
                      );

                    })}

                  </Nav>

                </div>
              )}

            </div>

          </Container>
        </Navbar>


        <Container fluid className="p-0">

          {/*----------- WELCOME BANNER ----------- */}


          <div className={styles.welcomeBanner}>
            <Carousel controls={true} interval={3000} indicators={false}>
              {this.state.welcomeBanners.map((item) => (
                <Carousel.Item
                  key={item.Id}
                  className={styles.slideDiv}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.RedirectURL?.Url) {
                      window.open(item.RedirectURL.Url, "_blank");
                    }
                  }}
                >
                  {/* ✅ Image instead of background */}
                  <img
                    src={item.ImageUrl}
                    alt={item.Title}
                    className={styles.bannerImg}
                  />

                  {/* Overlay content */}
                  <div className={styles.content}>
                    <h3>{item.Title}</h3>
                    <h6>{item.Description}</h6>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>

          {/*----------- QUICKLINKS ----------- */}


          <div className={styles.iconBanner}>


            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={0}
              slidesPerView={Math.min(9, totalItems)}
              navigation={totalItems > 9}
              autoplay={totalItems > 9 ? { delay: 2500 } : false}
              loop={false}
              breakpoints={{
                320: { slidesPerView: Math.min(3, totalItems) },
                576: { slidesPerView: Math.min(4, totalItems) },
                768: { slidesPerView: Math.min(6, totalItems) },
                992: { slidesPerView: Math.min(6, totalItems) },
                1200: { slidesPerView: Math.min(9, totalItems) },
              }}
            >
              {this.state.quickLinks.map((item) => (
                <SwiperSlide key={item.Id}>
                  <div className="d-flex align-items-center flex-column">
                    <a
                      href={item.RedirectURL?.Url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className={styles.iconBox}>
                        <img
                          src={item.ImageUrl}
                          alt={item.Title}
                          width={30}
                          height={30}
                          style={{ objectFit: "cover" }}
                          draggable={false}
                        />
                        <h5>{item.Title}</h5>
                      </div>
                    </a>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>



          {/*----------- MESSAGE FROM LEADERS BANNER ----------- */}
          <Row>
            <Col md={12} className="px-2">
              <div className={styles.messageSection}>
                <h4 className={styles.sectionHeading}>Message from Our Leaders</h4>

                <Carousel
                  interval={30000}
                  controls
                  prevIcon={
                    <span className={styles.customArrow}>
                      <i className="bi bi-arrow-left" />
                    </span>
                  }
                  nextIcon={
                    <span className={styles.customArrow}>
                      <i className="bi bi-arrow-right" />
                    </span>
                  }
                  className={styles.messageLeaderCarousel}
                >
                  {this.state.directorCorner.map(item => (
                    <Carousel.Item key={item.Id}>
                      <div className={styles.messageCard}>
                        <div className={styles.imageCard}>
                          <img
                            src={item.ImageUrl}
                            alt={item.Title}
                            className={styles.leaderImage}
                          />
                        </div>

                        <div className={styles.contentCard}>
                          <h2 className={styles.leaderName}>{item.Title}</h2>
                          <h6 className={styles.designation}>{item.Designation}</h6>
                          <p className={styles.messageText} style={{ WebkitLineClamp: 3 }}>{item.Message}</p>


                          <Button
                            size="sm"
                            variant="link"
                            className="px-0 text-decoration-none"
                            onClick={() => this.openMessagePreview(item)}
                          >
                            View More
                          </Button>
                        </div>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </Col>
          </Row>


          {/* ---------------- Performance Highlights ---------------- */}

          <Row className={styles.performanceHighlightsWrapper}>
            <Col md={6} className="px-2">
              {/* -------- Dynamic Tabs -------- */}
              <Nav
                variant="pills"
                activeKey={activeTab}
                onSelect={(key) => key && this.setState({ activeTab: key })}
                className={`${styles.customOutlinePills} flex-wrap`}
              >
                {[
                  { key: "performanceHighlights", label: "Performance Highlights" },
                  { key: "successStories", label: "Success Stories" },
                  { key: "testimonials", label: "Testimonials" }
                ].map(tab => (
                  <Nav.Item key={tab.key}>
                    <Nav.Link eventKey={tab.key}>{tab.label}</Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              {/* -------- Dynamic Carousel -------- */}
              <div className="tab-content p-1">
                {(this.state.highlightsData[activeTab] || []).length > 0 ? (
                  <div className={styles.announceBanner}>
                    <Carousel key={activeTab} controls={false} interval={8000} indicators>
                      {this.state.highlightsData[activeTab].map(item => (
                        <Carousel.Item key={item.Id}>
                          <div
                            className={styles.slide}
                            role="link"
                            tabIndex={0}
                            onClick={() => {
                              const folderUrl = item.RedirectURL;
                              if (folderUrl) {
                                window.open(folderUrl, "_blank");
                              }
                            }}
                          >
                            <img
                              src={item.ImageUrl}
                              alt={item.Title}
                            />

                            <div className={styles.contentDiv}>
                              <div className={styles.announceContent}>
                                <h4 ref={handleTitleRef(item.Title)}>{item.Title}</h4>

                                <p
                                  style={{ WebkitLineClamp: 2 }}
                                  ref={(el) => {
                                    if (el) {
                                      setTimeout(() => {
                                        const isOverflowing = el.scrollHeight > el.clientHeight;

                                        if (isOverflowing) {
                                          el.setAttribute("title", el.innerText);
                                        } else {
                                          el.removeAttribute("title");
                                        }
                                      }, 0);
                                    }
                                  }}
                                >
                                  {item.Description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                  </div>
                ) : (
                  // ✅ No data message
                  <div className={styles.noDataWrapper}>
                    No data to display
                  </div>
                )}
              </div>
            </Col>


            {/* Awards */}
            <Col md={3} className="px-2">
              <div className={styles.awardsBanner}>
                <Carousel controls={false} interval={10000} indicators>
                  {this.state.awards.map(item => (
                    <Carousel.Item key={item.Id}>
                      <div
                        className={styles.slide}
                        role="link"
                        tabIndex={0}
                        onClick={() => {
                          const folderUrl = item.RedirectURL;
                          if (folderUrl) {
                            window.open(folderUrl, "_blank");
                          }
                        }}

                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={item.ImageUrl}
                          alt={item.Title}
                        />

                        <div className={styles.imageTitleOverlay}>
                          <span className={styles.imageTitle}>Awards</span>
                        </div>

                        <div className={styles.contentDiv}>
                          <div className={styles.announceContent}>
                            <h4 ref={handleTitleRef(item.Title)}>{item.Title}</h4>
                            <p style={{ WebkitLineClamp: 2 }}
                              ref={(el) => {
                                if (el) {
                                  setTimeout(() => {
                                    const isOverflowing = el.scrollHeight > el.clientHeight;

                                    if (isOverflowing) {
                                      el.setAttribute("title", el.innerText);
                                    } else {
                                      el.removeAttribute("title");
                                    }
                                  }, 0);
                                }
                              }}
                            >{item.Description}</p>

                          </div>
                        </div>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </Col>


            {/* Governance */}
            <Col md={3} className="px-2">
              <div className={styles.governanceBanner}>
                <Carousel controls={false} interval={12000} indicators>
                  {this.state.governanceItems.map(item => (
                    <Carousel.Item key={item.Id}>
                      <div
                        className={styles.slide}
                        role="link"
                        tabIndex={0}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const folderUrl = item.RedirectURL;
                          if (folderUrl) {
                            window.open(folderUrl, "_blank");
                          }
                        }}

                      >
                        <img
                          src={item.ImageUrl}
                          alt={item.Title}
                        />
                        <div className={styles.imageTitleOverlay}>
                          <span className={styles.imageTitle}>Governance</span>
                        </div>


                        <div className={styles.contentDiv}>
                          <div className={styles.announceContent}>
                            <h4 ref={handleTitleRef(item.Title)}>{item.Title}</h4>
                            <p style={{ WebkitLineClamp: 2 }}
                              ref={(el) => {
                                if (el) {
                                  setTimeout(() => {
                                    const isOverflowing = el.scrollHeight > el.clientHeight;

                                    if (isOverflowing) {
                                      el.setAttribute("title", el.innerText);
                                    } else {
                                      el.removeAttribute("title");
                                    }
                                  }, 0);
                                }
                              }}
                            >{item.Description}</p>

                          </div>
                        </div>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </Col>

          </Row>


          {/*----------- TEAM CAROUSEL BANNER ----------- */}
          <div ref={this.sbuTeamSectionRef}>
            <Row>
              <Col md={12} className="px-2">
                <div className={styles.teamIsSection}>
                  <h4 className={styles.sectionHeading}>
                    Team {this.state.sbu || "Entity"}
                  </h4>

                  {/* Search */}
                  <InputGroup className="w-100 py-1 px-1 pb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search by name, email or role..."
                      value={this.state.searchText}
                      onChange={this.handleTeamSearch}
                      style={{ height: "36px", fontSize: "14px" }}
                    />
                  </InputGroup>

                  {this.state.filteredTeamMembers.length === 0 ? (
                    <div className={styles.noDataWrapper}>
                      <p className={styles.noDataText}>
                        {this.state.searchText
                          ? "No matching users found"
                          : "No data to display"}
                      </p>
                    </div>
                  ) : (

                    <div className={styles.teamIsCarouselWrapper}>

                      <Swiper
                        modules={[Autoplay, Navigation]}
                        autoplay={{
                          delay: 6000,
                          disableOnInteraction: false,
                        }}
                        loop={this.state.filteredTeamMembers.length > 1}
                        watchOverflow={false}
                        navigation={{
                          prevEl: ".teamPrev",
                          nextEl: ".teamNext",
                        }}
                        slidesPerView={5}
                        breakpoints={{
                          0: { slidesPerView: 1 },
                          576: { slidesPerView: 2 },
                          768: { slidesPerView: 3 },
                          1200: { slidesPerView: 5 },
                        }}
                        className={styles.teamIsCarousel}
                      >
                        {this.state.filteredTeamMembers.map((member) => (
                          <SwiperSlide key={member.Email}>
                            <Card className={styles.teamCard}>
                              <Card.Body className="text-center">

                                {/* Avatar */}
                                <img
                                  src={member.PictureUrl}
                                  alt={member.DisplayName}
                                  className="rounded-circle mb-3"
                                  width={80}
                                  height={80}
                                />

                                {/* Name */}
                                <h6 className={styles.memberName}>
                                  {member.DisplayName}
                                </h6>

                                {/* Role */}
                                <p className={styles.memberRole}>
                                  {member.JobTitle || "—"}
                                </p>

                                {/* Department */}
                                <small className={styles.memberDept}>
                                  {member.Department || "—"}
                                </small>

                                {/* Action */}
                                <div className={styles.buttonWrapper}>
                                  <Button
                                    className={styles.outlineBtn}
                                    onClick={() => this.modalOpen(member)}
                                  >
                                    View More
                                  </Button>
                                </div>

                              </Card.Body>
                            </Card>
                          </SwiperSlide>
                        ))}
                      </Swiper>

                      {/* Navigation Buttons */}
                      <div className="teamPrev">
                        <i className="bi bi-arrow-left" />
                      </div>

                      <div className="teamNext">
                        <i className="bi bi-arrow-right" />
                      </div>

                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/*----------- NEWS/Event/Broadcaste BANNER ----------- */}



          <div className={styles.newsBanner}>

            <h2 className={styles.sectionHeading}>TEAM {this.state.sbu || "Entity"} - Announcements, Broadcasts & Events</h2>
            <Row>
              <Col xs={12} md={6}>
                <div className={styles.newsannounceBanner}>
                  <div className={styles.bannerTitle}>
                    <h4>News & Announcements</h4>
                    <span
                      className={styles.seeAll}
                      role="link"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const folderUrl = `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllNews.aspx`;
                        window.open(folderUrl, "_blank");
                      }}
                    >
                      See All
                    </span>
                  </div>

                  {this.state.corporateNews.length === 0 ? (
                    <div className={styles.noDataWrapper}>
                      <p className={styles.noDataText}>No data to display</p>
                    </div>
                  ) : (
                    <Carousel controls={false} interval={8000} indicators>
                      {this.state.corporateNews.map((item) => (
                        <Carousel.Item key={item.Id}>
                          <div
                            className={styles.slide}
                            role="button"
                            tabIndex={0}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              this.openNewsPreview(item).catch(() => {
                                console.log("Something went wrong. Please contact administrator.");
                              });
                            }}

                          >
                            <img
                              src={item.ImageUrl}
                              alt={item.Title}
                            // onError={(e) => {
                            //   e.currentTarget.src = "/SiteAssets/default-news.jpg";
                            // }}

                            />

                            <div className={styles.contentDiv}>
                              <div className={styles.announceContent}>
                                <h3
                                  style={{ WebkitLineClamp: 2 }}
                                  ref={(el) => {
                                    if (el) {
                                      setTimeout(() => {
                                        const isOverflowing = el.scrollHeight > el.clientHeight;

                                        if (isOverflowing) {
                                          el.setAttribute("title", el.innerText);
                                        } else {
                                          el.removeAttribute("title");
                                        }
                                      }, 0);
                                    }
                                  }}

                                >{item.Title}</h3>
                                <h6>
                                  {new Date(item.PublishedDate).toLocaleDateString("en-IN", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </h6>
                              </div>
                            </div>

                            {/* Like Overlay */}
                            <div
                              className={`${styles.likeBox} ${item.liked ? styles.liked : ""
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleNewsLike(item).catch(() => {
                                  console.log("Something went wrong. Please contact administrator.");
                                });
                              }}
                            >
                              <i className="bi bi-hand-thumbs-up-fill" />
                              <span className={styles.likeCount}>{item.LikesCount ?? 0}</span>
                            </div>

                          </div>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                  )}
                </div>
              </Col>
              <Col xs={12} md={6}>
                {/* ----------- Broadcasts ----------- */}
                <div className={`${styles.broadcastBanner} mt-2 mt-sm-3 mt-md-0`}>
                  <div className={styles.bannerTitle}>
                    <h4>Corporate Broadcasts</h4>
                    <span
                      className={styles.seeAll}
                      role="link"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const folderUrl = `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllBroadcast.aspx`;
                        window.open(folderUrl, "_blank");
                      }}
                    >
                      See All
                    </span>
                  </div>

                  {this.state.broadcasts.length === 0 ? (
                    <div className={styles.noDataWrapper}>
                      <p className={styles.noDataText}>No data to display</p>
                    </div>
                  ) : (
                    <div className={styles.verticalMarqueeWrapper}>
                      <div
                        className={`${styles.verticalMarquee} ${this.state.isBroadcastPaused ? styles.paused : ""
                          }`}
                      >
                        {[...this.state.broadcasts, ...this.state.broadcasts].map(
                          (item, index) => (
                            <div
                              key={`${item.Id}-${index}`}
                              className={styles.marqueeItem}
                              role="button"
                              tabIndex={0}
                              style={{ cursor: "pointer" }}

                              onClick={() => {
                                this.openBroadcastPreview(item).catch(() => {
                                  console.log("Something went wrong. Please contact administrator.");
                                });
                              }}

                            >
                              <img
                                width={40}
                                height={40}
                                src={item.IconUrl}
                                alt={item.Title}
                              // onError={(e) => {
                              //   e.currentTarget.src =
                              //     "/SiteAssets/default-broadcast.png";
                              // }}
                              />
                              <h3 ref={handleTitleRef(item.Title)}>{item.Title}</h3>
                            </div>
                          )
                        )}
                      </div>

                      <button
                        className={styles.playPauseBtn}
                        onClick={this.toggleBroadcast}
                      >
                        {this.state.isBroadcastPaused ? "▶" : "⏸"}
                      </button>
                    </div>
                  )}
                </div>

                {/* ----------- Events ----------- */}
                <div className={styles.eventsBanner}>
                  <div className={styles.bannerTitle}>
                    <h4>Corporate Events</h4>
                    <span
                      className={styles.seeAll}
                      role="link"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const folderUrl = `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllEvents.aspx`;
                        window.open(folderUrl, "_blank");
                      }}
                    >
                      See All
                    </span>
                  </div>

                  {this.state.events.length === 0 ? (
                    <div className={styles.noDataWrapper}>
                      <p className={styles.noDataText}>No data to display</p>
                    </div>
                  ) : (
                    <div className={styles.verticalEventMarqueeWrapper}>
                      <div
                        className={`${styles.verticalMarquee} ${this.state.isEventPaused ? styles.paused : ""
                          }`}
                      >
                        {[...this.state.events, ...this.state.events].map((item, index) => (
                          <div
                            key={`${item.Id}-${index}`}
                            className={styles.marqueeItem}
                            role="button"
                            tabIndex={0}
                            onClick={() => this.openEventPreview(item)}

                          >
                            <img
                              src={item.ImageUrl}
                              alt={item.Title}
                            // onError={(e) => {
                            //   e.currentTarget.src = "/SiteAssets/default-event.jpg";
                            // }}
                            />

                            <div className={styles.eventContent}>
                              {/* 🔹 Floating Like Badge (Top Right) */}
                              <div
                                className={`${styles.likeBox} ${item.liked ? styles.liked : ""
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.handleEventLike(item).catch(() => {
                                    console.log("Something went wrong. Please contact administrator.");
                                  });
                                }}
                              >
                                <i className="bi bi-hand-thumbs-up-fill" />
                                <span className={styles.likeCount}>
                                  {item.LikesCount ?? 0}
                                </span>
                              </div>

                              {/* 🔹 Meta Row (Like Count + Date) */}
                              <div className={styles.metaInfo}>
                                {/* <div className={styles.metaItem}>
                                  <i className="bi bi-hand-thumbs-up"></i>
                                  <span>{item.LikesCount ?? 0}</span>
                                </div> */}

                                <div className={styles.metaItem}>
                                  <i className="bi bi-calendar3" />
                                  <span>
                                    {new Date(item.PublishedDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              <h3 ref={handleTitleRef(item.Title)}>{item.Title}</h3>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        className={styles.playPauseBtn}
                        onClick={this.toggleEvent}
                      >
                        {this.state.isEventPaused ? "▶" : "⏸"}
                      </button>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

          </div>



          {/*-----------  Contact us ----------- */}
          <Row>
            <Col md={12} className="px-2">
              <section className={styles.connectboxBanner}>
                <Carousel
                  controls={false}
                  indicators
                  interval={4000}
                  className={styles.connectCarousel}
                >
                  {this.state.contactUsSlides.map(item => (
                    <Carousel.Item key={item.Id}>
                      <div
                        className={styles.connectBox}
                        style={{
                          backgroundImage: `
                  linear-gradient(
                    90deg,
                    rgba(10,31,61,0.9) 0%,
                    rgba(36,59,107,0.85) 50%,
                    rgba(179,0,0,0.85) 100%
                  ),
                  url(${item.ImageUrl})
                `
                        }}
                      >
                        <div className="row align-items-center">
                          <div className="col-md-9 text-white">
                            <h2 className={styles.connectheading}>
                              {item.ContactTitle}
                            </h2>

                            <p className={styles.connectdescription}>
                              {item.ContactDesc}
                            </p>
                          </div>

                          <div className="col-md-3 text-md-end mt-3 mt-md-0">
                            <Button
                              className="btn btn-light px-4 fw-bold"
                              onClick={() => {
                                if (item.RedirectURL) {
                                  window.open(item.RedirectURL, "_blank");
                                }
                              }}
                            >
                              Contact Us
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              </section>
            </Col>
          </Row>

          {/* ---------------- Mission ---------------- */}

          <Row>
            <Col md={12} className="px-2">
              <div className={styles.missionContentSection}>

                {/* Header */}
                <div className={styles.missionHeader}>
                  <h4 className={styles.sectionHeading}>
                   Vision, Mission,  & Values
                  </h4>

                  <div className={styles.topRightControls}>
                    <button
                      className={styles.missionPrev}
                      aria-label="Previous"
                    >
                      <i className="bi bi-chevron-left" />
                    </button>
                    <button
                      className={styles.missionNext}
                      aria-label="Next"
                    >
                      <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>

                {/* Swiper */}
                {missionItems && missionItems.length > 0 ? (
                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={16}
                    slidesPerView={3}
                    navigation={{
                      prevEl: `.${styles.missionPrev}`,
                      nextEl: `.${styles.missionNext}`
                    }}
                    loop
                    // autoplay={{ delay: 5000 }}
                    breakpoints={{
                      0: { slidesPerView: 1 },
                      576: { slidesPerView: 1.2 },
                      768: { slidesPerView: 2 },
                      992: { slidesPerView: 3 }
                    }}
                  >
                    {missionItems.map((item) => (
                      <SwiperSlide key={item.Id}>
                        <div
                          className="w-100 text-decoration-none"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            const folderUrl = item.RedirectURL;
                            if (folderUrl) {
                              window.open(folderUrl, "_blank");
                            }
                          }}
                        >
                          <Card className={`${styles.cardCommon}`}>
                            <Card.Body>
                              <img src={item.ImageUrl} alt={item.Title} width={50} />

                              <div className={styles.missionContent}>

                                <h5 className={styles.titleText}>{item.Title}</h5>


                                <p
                                  className={styles.desc}
                                  style={{ WebkitLineClamp: 2 }}
                                  ref={(el) => {
                                    if (el) {
                                      setTimeout(() => {
                                        const isOverflowing = el.scrollHeight > el.clientHeight;

                                        if (isOverflowing) {
                                          el.setAttribute("title", el.innerText);
                                        } else {
                                          el.removeAttribute("title");
                                        }
                                      }, 0);
                                    }
                                  }}
                                >
                                  {item.Description}
                                </p>

                              </div>

                            </Card.Body>
                          </Card>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  // ✅ No data UI
                  <div className={styles.noDataWrapper}>
                    No data to display
                  </div>)}
              </div>
            </Col>
          </Row>


          {/* ---------------- Business Units ---------------- */}

          <Row>
            <Col md={12} className="px-2 mb-3">
              <div className={styles.businessUnitsSection}>
                <h4 className={`${styles.sectionHeading} px-5`}>
                  Business Units
                </h4>

                <div className={styles.marqueeWrapper}>
                  <div className={styles.marqueeTrack}>
                    {[...this.state.businessUnits, ...this.state.businessUnits].map(
                      (unit, index) => (
                        <div key={index} className={styles.marqueeItem}>
                          <div
                            className={styles.unitCard}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const folderUrl = unit.RedirectURL;
                              if (folderUrl) {
                                window.open(folderUrl, "_blank");
                              }
                            }}
                          >
                            <img
                              src={unit.ImageUrl}
                              alt={unit.Title}
                              className={styles.unitImage}
                            />
                            <div className={styles.unitOverlay}>
                              <span className={styles.unitTitle}>
                                {unit.Title}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <PreviewBroadcastModal
            show={this.state.showPreview}
            onClose={this.closeBroadcastPreview}
            item={this.state.previewItem}
            attachments={this.state.previewAttachments}
          />

          <PreviewEventsModal
            show={this.state.showEventPreview}
            onClose={this.closeEventPreview}
            item={this.state.previewEventItem}
            attachments={this.state.previewEventAttachments}
          />

          {this.state.selectedNewsItem &&
            this.state.selectedNewsItem.NewsTypes?.WssId === 24 ? (
            <StaffPostingModal
              show={this.state.showNewsPreview}
              onClose={this.closeNewsPreview}
              itemId={this.state.selectedNewsItem.Id}
              title={this.state.selectedNewsItem.Title}
              date={this.state.selectedNewsItem.PublishedDate}
              service={this.staffPostingService}
            />
          ) : (
            <PreviewNewsModal
              show={this.state.showNewsPreview}
              onClose={this.closeNewsPreview}
              item={this.state.selectedNewsItem}
              attachments={this.state.newsAttachments}
            />
          )}

          <MessagePreviewModal
            show={this.state.showMessagePreview}
            onClose={this.closeMessagePreview}
            leader={this.state.selectedLeader}
            activeImageIndex={this.state.activeImageIndex}
            onThumbnailClick={this.setActiveImage}
          />
          <TeamProfileModal
            show={this.state.modalshow}
            onClose={this.modalClose}
            user={this.state.selectedTeamMember}
            department={this.state.myDepartment}
          />
        </Container>




      </section>


    );
  }
}
